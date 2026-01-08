// src/features/settings/index.js

import { createActor } from 'xstate';
import { createSettingsMachine } from './settings.machine.js';
import { SettingsRepository } from './settings.repository.js';
import { SettingsService } from './settings.service.js';

export const settingsFeature = {
	id: 'settings',
	name: 'Settings',
	version: '1.0.0',

	dependencies: ['persistence', 'auth'],

	async onMount(mountContext) {
		console.log('⚙️ Mounting Settings feature...');

		const persistenceResult =
			mountContext.featureRegistry.getMountResult('persistence');
		const authResult = mountContext.featureRegistry.getMountResult('auth');

		if (!persistenceResult?.service || !authResult?.actor) {
			throw new Error('Required dependencies missing');
		}

		// Храним ссылку на текущий запущенный актор
		let currentSettingsActor = null;

		// --- Функция запуска актора ---
		const startActor = (username, identity) => {
			// Если актор уже есть - ничего не делаем (или перезапускаем, если юзер сменился)
			if (currentSettingsActor) {
				const snapshot = currentSettingsActor.getSnapshot();
				if (snapshot.context.username === username) {
					return currentSettingsActor;
				}
				// Если юзер другой - останавливаем старый
				stopActor();
			}

			console.log('👤 Initializing Settings for user:', username);

			const repo = new SettingsRepository(persistenceResult.service);
			const service = new SettingsService();
			const authService = authResult.authService;
			const authRepo = authResult.authRepo;

			const settingsMachine = createSettingsMachine({
				repo,
				service,
				username,
				identity,
				authService,
				authRepo,
				eventBus: mountContext.eventBus,
			});

			const actor = createActor(settingsMachine);
			actor.start();
			currentSettingsActor = actor;

			// Регистрируем (перезаписываем) в реестре
			// ВАЖНО: ActorRegistry теперь отслеживает жизненный цикл актора
			if (mountContext.actorRegistry) {
				mountContext.actorRegistry.register('settings', actor, {
					type: 'feature',
					feature: 'settings',
					username: username,
				});
			}

			// Оповещаем UI через EventBus
			if (mountContext.eventBus) {
				mountContext.eventBus.dispatch({
					type: 'SETTINGS_READY',
					actor: actor,
					username: username,
				});
			}

			return actor;
		};

		// --- Функция остановки актора ---
		const stopActor = () => {
			if (currentSettingsActor) {
				console.log('🛑 Stopping Settings Actor (Logout/Switch)...');
				currentSettingsActor.stop();
				currentSettingsActor = null;
			}
		};

		// --- Логика наблюдения за Auth ---

		// 1. Проверяем текущее состояние сразу
		const authSnapshot = authResult.actor.getSnapshot();
		if (authSnapshot.matches('authenticated')) {
			const { username, identity } = authSnapshot.context;
			startActor(username, identity);
		}

		// 2. Подписываемся ПОСТОЯННО (не отписываемся после первого раза)
		// чтобы ловить Logout и Login другого юзера
		const subscription = authResult.actor.subscribe((snapshot) => {
			// ВХОД
			if (snapshot.matches('authenticated')) {
				const { username, identity } = snapshot.context;
				// Запускаем, если еще не запущен для этого юзера
				startActor(username, identity);
			}
			// ВЫХОД / GUEST
			else {
				// Если мы вышли, но актор все еще работает - убиваем его
				stopActor();
			}
		});

		// Возвращаем объект для featureRegistry
		// ВАЖНО: Актор управляется динамически, поэтому мы возвращаем функцию + текущее значение
		return {
			// Текущий актор (может быть null если гость)
			// ActorRegistry будет использовать это значение при регистрации
			actor: currentSettingsActor,

			// Дополнительно: функция для получения текущего актора
			// (используется в getMountResult().getActor?.())
			getActor: () => currentSettingsActor,

			// Подписка на auth для отписки при umount
			subscription,

			// Функция для остановки актора вручную
			stopActor,
		};
	},

	async onUnmount(context) {
		console.log('⚙️ Settings feature unmounting...');

		// Отписываемся от Auth
		if (context.subscription) {
			console.log('  - Unsubscribing from auth');
			context.subscription.unsubscribe();
		}

		// Останавливаем актор
		const actor = context.getActor?.() || context.actor;
		if (actor) {
			console.log('  - Stopping settings actor');
			try {
				actor.stop();
			} catch (e) {
				console.error('[Settings] Error stopping actor:', e);
			}
		}

		console.log('⚙️ Settings feature unmounted');
	},
};
