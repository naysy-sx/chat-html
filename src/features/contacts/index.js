// src/features/contacts/index.js

import { createActor } from 'xstate';
import { ContactsRepository } from './contacts.repository.js';
import { ContactsService } from './contacts.service.js';
import { createContactsMachine } from './contacts.machine.js';

export const contactsFeature = {
	id: 'contacts',
	name: 'Contacts',
	version: '1.0.0',
	dependencies: ['persistence', 'signaling', 'auth'], // ✅ ДОБАВЛЕНО: явная зависимость от auth

	async onMount(context) {
		const { actorRegistry, eventBus, featureRegistry } = context;

		console.log('🎯 CONTACTS FEATURE: onMount called!');
		console.log('📇 Mounting Contacts feature...');

		let actor = null;
		let service = null;
		let repository = null;
		let onReloadRequested = null;
		let currentUsername = null; // ✅ ДОБАВЛЕНО: отслеживаем текущего пользователя

		// ✅ ДОБАВЛЕНО: Получаем auth actor для подписки
		const authResult = featureRegistry.getMountResult('auth');
		if (!authResult?.actor) {
			console.error('❌ Auth actor not found!');
			return;
		}

		// Функция запуска актора
		const startActor = async (signalingActor, username) => {
			console.log(
				'🎯 CONTACTS: startActor called for user:',
				username,
				'actor existing?',
				actor ? 'yes' : 'no'
			);

			// ✅ Если уже запущен для этого пользователя - не перезапускаем
			if (actor && currentUsername === username) {
				console.log(
					'🎯 CONTACTS: Actor already exists for this user, returning'
				);
				return;
			}

			// ✅ Если запущен для другого пользователя - останавливаем
			if (actor && currentUsername !== username) {
				console.log('🎯 CONTACTS: Different user, stopping old actor');
				stopActor();
			}

			console.log('📇 Starting Contacts actor for:', username);
			currentUsername = username;

			// ✅ Создаём репозиторий с owner (username)
			try {
				repository = new ContactsRepository(username);
				await repository.init();
				console.log('✅ Contacts repository initialized for:', username);
			} catch (err) {
				console.error('❌ Failed to initialize repository:', err);
				return;
			}

			// Try to retrieve current user profile from profile actor (if available)
			const profileActor = actorRegistry.get && actorRegistry.get('profile');
			const initialProfile =
				profileActor?.getSnapshot?.()?.context?.profile || null;

			service = new ContactsService(
				repository,
				signalingActor,
				eventBus,
				initialProfile
			);

			const machine = createContactsMachine({ service, eventBus });

			actor = createActor(machine);
			actor.start();

			actorRegistry.register('contacts', actor);

			// Подписываемся на запросы перезагрузки
			onReloadRequested = () => {
				console.log(
					'📇 CONTACTS_RELOAD_REQUESTED received, sending RELOAD to actor'
				);
				if (actor) {
					actor.send({ type: 'RELOAD' });
				}
			};
			eventBus.on('CONTACTS_RELOAD_REQUESTED', onReloadRequested);

			console.log('📡 Dispatching CONTACTS_READY event');
			eventBus.dispatch({ type: 'CONTACTS_READY', actor });

			console.log('✅ Contacts actor started for user:', username);
		};

		// Функция остановки актора
		const stopActor = () => {
			if (!actor) return;

			console.log('📇 Stopping Contacts actor for user:', currentUsername);

			if (onReloadRequested) {
				eventBus.off('CONTACTS_RELOAD_REQUESTED', onReloadRequested);
				onReloadRequested = null;
			}

			actor.stop();
			actorRegistry.unregister('contacts');
			actor = null;
			service = null;
			repository = null;
			currentUsername = null;

			console.log('🔌 Contacts actor stopped');
		};

		// ✅ ДОБАВЛЕНО: Подписка на изменения auth
		const handleAuthChange = (snapshot) => {
			const state = snapshot.value;
			const username = snapshot.context?.username;

			console.log(
				'🎯 CONTACTS: Auth changed, state:',
				state,
				'username:',
				username
			);

			// Проверяем что пользователь аутентифицирован
			const isAuthenticated =
				state === 'authenticated' ||
				(typeof state === 'object' && 'authenticated' in state);

			if (isAuthenticated && username) {
				// Получаем signaling actor
				const signalingActor = actorRegistry.get('signaling');
				if (signalingActor) {
					console.log(
						'🎯 CONTACTS: Auth authenticated + signaling ready, starting'
					);
					startActor(signalingActor, username);
				} else {
					console.log(
						'🎯 CONTACTS: Auth authenticated but signaling not ready yet'
					);
				}
			} else {
				console.log('🎯 CONTACTS: Auth not authenticated, stopping actor');
				stopActor();
			}
		};

		// ✅ Подписываемся на auth
		const authSubscription = authResult.actor.subscribe(handleAuthChange);

		// ✅ Проверяем текущее состояние сразу
		handleAuthChange(authResult.actor.getSnapshot());

		// Подписываемся на SIGNALING_READY
		const onSignalingReady = (event) => {
			console.log('🎯 CONTACTS: SIGNALING_READY received');

			// Получаем текущий username из auth
			const authSnapshot = authResult.actor.getSnapshot();
			const username = authSnapshot.context?.username;

			if (username) {
				const signalingActor = event.actor || actorRegistry.get('signaling');
				if (signalingActor) {
					console.log('🎯 CONTACTS: Signaling ready + auth OK, starting');
					startActor(signalingActor, username);
				}
			} else {
				console.log('🎯 CONTACTS: Signaling ready but no authenticated user');
			}
		};
		eventBus.on('SIGNALING_READY', onSignalingReady);

		// Forward signaling events to contacts actor
		const forwardSignalingEvent = (evt) => {
			if (!actor) return;
			actor.send(evt);
		};

		// Listen for local profile updates
		const onLocalProfileUpdated = (event) => {
			console.log('🎯 CONTACTS: PROFILE_UPDATED received', !!service);
			if (service) {
				service.profile = event.profile || null;
			}
		};
		eventBus.on('PROFILE_UPDATED', onLocalProfileUpdated);

		// ✅ Подписка на broadcast профиля контактам
		const onProfileShouldBroadcast = async (event) => {
			console.log('📢 CONTACTS: PROFILE_SHOULD_BROADCAST received');

			if (!service) {
				console.warn('⚠️ Service not ready, skipping broadcast');
				return;
			}

			try {
				const contactIds = await service.getAcceptedContactIds();

				if (contactIds.length === 0) {
					console.log('📢 No accepted contacts to broadcast to');
					return;
				}

				const signalingActor = actorRegistry.get('signaling');
				if (!signalingActor) {
					console.error('❌ Signaling actor not found for broadcast');
					return;
				}

				signalingActor.send({
					type: 'BROADCAST_PROFILE',
					contactIds,
					profile: event.profile,
				});

				console.log(
					`📢 Profile broadcast initiated to ${contactIds.length} contacts`
				);
			} catch (err) {
				console.error('❌ Failed to broadcast profile:', err);
			}
		};
		eventBus.on('PROFILE_SHOULD_BROADCAST', onProfileShouldBroadcast);

		const SIGNALING_EVENTS = [
			'SIGNALING_INVITE_RECEIVED',
			'SIGNALING_INVITE_ACCEPTED',
			'SIGNALING_INVITE_REJECTED',
			'SIGNALING_CONTACT_DELETED',
			'SIGNALING_CONTACT_BLOCKED',
			'SIGNALING_PROFILE_UPDATED',
		];

		for (const ev of SIGNALING_EVENTS) {
			eventBus.on(ev, forwardSignalingEvent);
		}

		console.log('✅ Contacts feature mounted');

		// Возвращаем cleanup и getActor
		return {
			getActor: () => actor,
			cleanup: async () => {
				// ✅ Отписываемся от auth
				authSubscription.unsubscribe();

				eventBus.off('SIGNALING_READY', onSignalingReady);
				for (const ev of SIGNALING_EVENTS) {
					eventBus.off(ev, forwardSignalingEvent);
				}

				eventBus.off('PROFILE_UPDATED', onLocalProfileUpdated);
				eventBus.off('PROFILE_SHOULD_BROADCAST', onProfileShouldBroadcast);

				stopActor();
				console.log('🔌 Contacts feature unmounted');
			},
		};
	},
};
