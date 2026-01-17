// src/features/app-settings/index.js

import { createActor } from 'xstate';
import { createAppSettingsMachine } from './app-settings.machine.js';
import { AppSettingsRepository } from './app-settings.repository.js';
import { AppSettingsService } from './app-settings.service.js';

export const appSettingsFeature = {
	id: 'app-settings',
	name: 'App Settings',
	version: '1.0.0',

	dependencies: ['persistence', 'auth'],

	async onMount(mountContext) {
		console.log('⚙️ Mounting App Settings feature...');

		const persistenceResult =
			mountContext.featureRegistry.getMountResult('persistence');
		const authResult = mountContext.featureRegistry.getMountResult('auth');

		if (!persistenceResult?.service || !authResult?.actor) {
			throw new Error('Required dependencies missing');
		}

		let currentAppSettingsActor = null;

		// --- Функция запуска актора ---
		const startActor = (username) => {
			if (currentAppSettingsActor) {
				const snapshot = currentAppSettingsActor.getSnapshot();
				if (snapshot.context.username === username) {
					return currentAppSettingsActor;
				}
				stopActor();
			}

			console.log('⚙️ Initializing App Settings for user:', username);

			const repo = new AppSettingsRepository(persistenceResult.service);
			const service = new AppSettingsService();

			const appSettingsMachine = createAppSettingsMachine({
				repo,
				service,
				username,
				eventBus: mountContext.eventBus,
			});

			const actor = createActor(appSettingsMachine);
			actor.start();
			currentAppSettingsActor = actor;

			if (mountContext.actorRegistry) {
				mountContext.actorRegistry.register('app-settings', actor, {
					type: 'feature',
					feature: 'app-settings',
					username: username,
				});
			}

			// Диспатчим событие готовности
			if (mountContext.eventBus) {
				setTimeout(() => {
					console.log('📡 Dispatching APP_SETTINGS_READY event');
					mountContext.eventBus.dispatch({
						type: 'APP_SETTINGS_READY',
						actor: actor,
						username: username,
					});
				}, 0);
			}

			return actor;
		};

		// --- Функция остановки актора ---
		const stopActor = () => {
			if (currentAppSettingsActor) {
				console.log('🛑 Stopping App Settings Actor...');
				currentAppSettingsActor.stop();
				currentAppSettingsActor = null;
			}
		};

		// --- Логика наблюдения за Auth ---
		const authSnapshot = authResult.actor.getSnapshot();
		if (authSnapshot.matches('authenticated')) {
			const { username } = authSnapshot.context;
			startActor(username);
		}

		const subscription = authResult.actor.subscribe((snapshot) => {
			if (snapshot.matches('authenticated')) {
				const { username } = snapshot.context;
				startActor(username);
			} else {
				stopActor();
			}
		});

		return {
			actor: currentAppSettingsActor,
			getActor: () => currentAppSettingsActor,
			subscription,
			stopActor,
		};
	},

	async onUnmount(context) {
		console.log('⚙️ App Settings feature unmounting...');

		if (context.subscription) {
			console.log('  - Unsubscribing from auth');
			context.subscription.unsubscribe();
		}

		const actor = context.getActor?.() || context.actor;
		if (actor) {
			console.log('  - Stopping app-settings actor');
			try {
				actor.stop();
			} catch (e) {
				console.error('[AppSettings] Error stopping actor:', e);
			}
		}

		console.log('⚙️ App Settings feature unmounted');
	},
};
