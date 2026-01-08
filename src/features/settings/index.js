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
			if (mountContext.actorRegistry) {
				mountContext.actorRegistry.register('settings', actor, {
					type: 'feature',
					feature: 'settings',
				});
			}

			// Оповещаем UI через EventBus
			if (mountContext.eventBus) {
				mountContext.eventBus.dispatch({
					type: 'SETTINGS_READY',
					actor: actor,
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

				// Можно также оповестить EventBus о сбросе настроек, если нужно
				if (mountContext.eventBus) {
					// Опционально: событие что настройки выгружены
				}
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

		// Возвращаем объект для featureRegistry.
		// Важно: мы возвращаем методы управления, но сам featureRegistry
		// не будет автоматически обновлять поле 'actor', так как мы его меняем динамически.
		// Поэтому UI должен полагаться на EventBus (как мы и сделали).
		return {
			// Метод для ручного получения (если нужно)
			getActor: () => currentSettingsActor,
			subscription, // возвращаем подписку, чтобы featureRegistry мог ее сохранить (опционально)
		};
	},

	async onUnmount(context) {
		// Отписываемся от Auth
		if (context.subscription) {
			context.subscription.unsubscribe();
		}

		// Останавливаем актор
		const actor = context.getActor ? context.getActor() : null;
		if (actor) {
			actor.stop();
		}

		console.log('⚙️ Settings feature unmounted');
	},
};
