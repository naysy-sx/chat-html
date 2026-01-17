// src/features/signaling/index.js

import { createActor } from 'xstate';
import { createSignalingMachine } from './signaling.machine.js';
import { SignalingService } from './signaling.service.js';

const DEFAULT_SERVER_URL =
	'https://functions.yandexcloud.net/d4eembfgfpdabtj2no3m';

export const signalingFeature = {
	id: 'signaling',
	name: 'Signaling',
	version: '2.0.0',

	// ✅ ИЗМЕНЕНО: Убираем зависимость от identity, берём из auth
	dependencies: ['persistence', 'auth'],

	async onMount(mountContext) {
		console.log('📡 Mounting Signaling feature...');

		const { featureRegistry, eventBus, actorRegistry } = mountContext;

		const authResult = featureRegistry.getMountResult('auth');
		let profileResult = featureRegistry.getMountResult('profile');

		if (!authResult?.actor) {
			console.error('❌ Auth feature required for signaling');
			return;
		}

		let currentActor = null;
		let currentService = null;

		const getServerUrl = () => {
			if (!profileResult?.actor) return DEFAULT_SERVER_URL;

			const settingsSnapshot = profileResult.actor.getSnapshot();
			const activeServerId = settingsSnapshot.context.activeServerId;
			const servers = settingsSnapshot.context.signalingServers || [];
			const server = servers.find((s) => s.id === activeServerId);

			return server?.url || DEFAULT_SERVER_URL;
		};

		const getProfile = () => {
			// Prefer settings profile when available
			const settingsProfile =
				profileResult?.actor?.getSnapshot().context.profile;
			if (settingsProfile) return settingsProfile;

			// Fallback to auth user info (username) so invites contain a display name
			try {
				const user = authResult.getUser?.();
				if (user && user.username) {
					return {
						displayName: user.username,
						username: user.username,
						bio: '',
						avatar: null,
					};
				}
			} catch (err) {
				console.warn('⚠️ getProfile fallback failed:', err.message || err);
			}

			return null;
		};

		// ✅ ИСПРАВЛЕНО: Берём identity из AUTH, а не из identity feature!
		const getIdentityFromAuth = () => {
			const authSnapshot = authResult.actor.getSnapshot();
			const identity = authSnapshot.context.identity;

			if (!identity) {
				console.warn('⚠️ No identity in auth context');
				return null;
			}

			// identity из auth уже имеет структуру { userId, identity, exchange, ... }
			// или может быть в старом формате - проверяем
			console.log('📡 Getting identity from auth:', {
				hasUserId: !!identity.userId,
				hasExchange: !!identity.exchange,
				keys: Object.keys(identity),
			});

			return {
				userId: identity.userId,
				identity: identity.identity,
				exchange: identity.exchange,
				version: identity.version,
			};
		};

		const stopActor = () => {
			if (currentActor) {
				console.log('📡 Stopping Signaling Actor...');
				currentActor.send({ type: 'DISCONNECT' });
				currentActor.stop();

				if (actorRegistry) {
					actorRegistry.unregister('signaling');
				}

				currentActor = null;
				currentService = null;
			}
		};

		const startActor = () => {
			if (currentActor) return;

			// ✅ ИСПРАВЛЕНО: Используем identity из auth!
			const identity = getIdentityFromAuth();
			if (!identity || !identity.userId) {
				console.warn('⚠️ Cannot start signaling: no identity in auth');
				return;
			}

			console.log('📡 Starting Signaling Actor...');
			console.log('📡 Identity from AUTH:', {
				userId: identity.userId?.slice(0, 16) + '...',
				hasExchangeKey: !!identity.exchange?.publicKey,
			});

			const url = getServerUrl();
			console.log('📡 Target URL:', url);

			currentService = new SignalingService(url);

			const machine = createSignalingMachine({
				service: currentService,
				identity: identity,
				profile: getProfile(),
				eventBus: eventBus,
			});

			currentActor = createActor(machine);
			currentActor.start();

			console.log('📡 Sending CONNECT event');
			currentActor.send({ type: 'CONNECT' });

			if (actorRegistry) {
				actorRegistry.register('signaling', currentActor, {
					type: 'feature',
					feature: 'signaling',
				});
			}

			console.log('📡 Dispatching SIGNALING_READY event');
			eventBus.dispatch({ type: 'SIGNALING_READY', actor: currentActor });

			const snapshot = currentActor.getSnapshot();
			console.log('📡 Machine initial state:', snapshot.value);
		};

		// Подписка на Auth
		const handleAuthChange = (snapshot) => {
			const state = snapshot.value;
			const isAuthenticated =
				state === 'authenticated' ||
				(typeof state === 'object' && 'authenticated' in state);

			console.log(
				'📡 Auth state changed:',
				state,
				'isAuthenticated:',
				isAuthenticated
			);

			if (isAuthenticated) {
				// ✅ Проверяем что identity есть в контексте
				const identity = snapshot.context.identity;
				console.log(
					'📡 Auth identity available:',
					!!identity,
					identity?.userId?.slice(0, 16) + '...'
				);

				if (!currentActor && identity) {
					startActor();
				}
			} else {
				stopActor();
			}
		};

		const authSubscription = authResult.actor.subscribe(handleAuthChange);
		handleAuthChange(authResult.actor.getSnapshot());

		// Остальные подписки без изменений
		const onProfileUpdated = (event) => {
			if (currentActor) {
				currentActor.send({
					type: 'UPDATE_PROFILE',
					profile: event.profile,
				});
			}
		};
		eventBus.on('PROFILE_UPDATED', onProfileUpdated);

		const onProfileReady = (event) => {
			console.log('📡 Settings ready, updating reference');
			if (event.actor) {
				profileResult = { actor: event.actor };
			}
		};
		eventBus.on('PROFILE_READY', onProfileReady);

		const onServerChanged = (event) => {
			console.log('📡 Switching signaling server to:', event.serverUrl);

			if (currentActor) {
				stopActor();
				setTimeout(() => {
					startActor();
				}, 100);
			}
		};
		eventBus.on('SIGNALING_SERVER_CHANGED', onServerChanged);

		return {
			getActor: () => currentActor,
			getService: () => currentService,
			cleanup: () => {
				authSubscription.unsubscribe();
				eventBus.off('PROFILE_UPDATED', onProfileUpdated);
				eventBus.off('PROFILE_READY', onProfileReady);
				eventBus.off('SIGNALING_SERVER_CHANGED', onServerChanged);
				stopActor();
			},
		};
	},

	async onUnmount(context) {
		context.cleanup?.();
		console.log('📡 Signaling feature unmounted');
	},
};

export { SignalingService } from './signaling.service.js';
export { createSignalingMachine } from './signaling.machine.js';
