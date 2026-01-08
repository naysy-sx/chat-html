// src/features/signaling/index.js

import { createActor } from 'xstate';
// Используем фабрику, как было в V1, так как импортируется именно она
import { createSignalingMachine } from './signaling.machine.js';
import { SignalingService } from './signaling.service.js';

// URL по умолчанию (твоя Cloud Function)
const DEFAULT_SERVER_URL =
	'https://functions.yandexcloud.net/d4eembfgfpdabtj2no3m';

export const signalingFeature = {
	id: 'signaling',
	name: 'Signaling',
	version: '2.0.0',

	// ✅ Только auth, без settings
	// Settings может получить актор через eventBus SIGNALING_READY событие
	dependencies: ['auth'],

	async onMount(mountContext) {
		console.log('📡 Mounting Signaling feature...');

		const { featureRegistry, eventBus, actorRegistry } = mountContext;

		const authResult = featureRegistry.getMountResult('auth');
		// Settings может быть еще не смонтирована, но мы получим её через подписку позже
		let settingsResult = featureRegistry.getMountResult('settings');

		if (!authResult?.actor) {
			console.error('❌ Auth feature required for signaling');
			return;
		}

		// Переменные состояния модуля
		let currentActor = null;
		let currentService = null;

		// --- Вспомогательные функции ---

		// Получить URL: сначала ищем в настройках, если нет — дефолтный
		const getServerUrl = () => {
			if (!settingsResult?.actor) return DEFAULT_SERVER_URL;

			const settingsSnapshot = settingsResult.actor.getSnapshot();
			const activeServerId = settingsSnapshot.context.activeServerId;
			const servers = settingsSnapshot.context.signalingServers || [];
			const server = servers.find((s) => s.id === activeServerId);

			return server?.url || DEFAULT_SERVER_URL;
		};

		// Получить профиль
		const getProfile = () => {
			return settingsResult?.actor?.getSnapshot().context.profile || null;
		};

		// Остановка актора
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

		// Запуск актора
		const startActor = (identity) => {
			if (currentActor) return; // Уже запущен

			console.log('📡 Starting Signaling Actor...');
			const url = getServerUrl();
			console.log('📡 Target URL:', url);

			// 1. Создаем сервис
			currentService = new SignalingService(url);

			// 2. Создаем машину через фабрику (передаем зависимости)
			// Важно: здесь мы передаем зависимости так, как это обычно делается в фабриках XState
			const machine = createSignalingMachine({
				service: currentService,
				identity: identity,
				profile: getProfile(),
				eventBus: eventBus,
			});

			// 3. Создаем и запускаем актора
			currentActor = createActor(machine);
			currentActor.start();

			// 4. Сразу инициируем подключение
			currentActor.send({ type: 'CONNECT' });

			// 5. Регистрируем
			if (actorRegistry) {
				actorRegistry.register('signaling', currentActor, {
					type: 'feature',
					feature: 'signaling',
				});
			}

			// 6. Уведомляем систему
			console.log(
				'📡 Dispatching SIGNALING_READY event with actor:',
				currentActor
			);
			eventBus.dispatch({ type: 'SIGNALING_READY', actor: currentActor });
		};

		// --- Подписки (Subscriptions) ---

		// 1. Логика Авторизации (Auth)
		const handleAuthChange = (snapshot) => {
			const state = snapshot.value;
			// Проверяем, авторизован ли пользователь (учитываем вложенные состояния xstate)
			const isAuthenticated =
				state === 'authenticated' ||
				(typeof state === 'object' && 'authenticated' in state);

			if (isAuthenticated && snapshot.context.identity) {
				// Если пользователь есть и актора нет — создаем
				if (!currentActor) {
					startActor(snapshot.context.identity);
				}
			} else {
				// Если вышли — убиваем сигналинг
				stopActor();
			}
		};

		const authSubscription = authResult.actor.subscribe(handleAuthChange);
		// Инициализация при старте (если юзер уже залогинен)
		handleAuthChange(authResult.actor.getSnapshot());

		// 2. Логика обновления профиля
		const onProfileUpdated = (event) => {
			if (currentActor) {
				currentActor.send({
					type: 'UPDATE_PROFILE',
					profile: event.profile,
				});
			}
		};
		eventBus.on('PROFILE_UPDATED', onProfileUpdated);

		// 2б. Логика обновления ссылки на settings когда он смонтируется
		const onSettingsReady = (event) => {
			console.log('📡 Settings ready, updating reference');
			if (event.actor) {
				settingsResult = { actor: event.actor };
			}
		};
		eventBus.on('SETTINGS_READY', onSettingsReady);

		// 3. Логика смены сервера
		const onServerChanged = (event) => {
			console.log('📡 Switching signaling server to:', event.serverUrl);

			// Если актор запущен, нужно его перезапустить с новым URL
			if (currentActor) {
				const identity = authResult.actor.getSnapshot().context.identity;
				stopActor();

				// Небольший таймаут, чтобы сокеты успели закрыться
				setTimeout(() => {
					startActor(identity);
				}, 100);
			}
		};
		eventBus.on('SIGNALING_SERVER_CHANGED', onServerChanged);

		// Возвращаем методы управления жизненным циклом
		return {
			getActor: () => currentActor,
			getService: () => currentService,
			cleanup: () => {
				authSubscription.unsubscribe();
				eventBus.off('PROFILE_UPDATED', onProfileUpdated);
				eventBus.off('SETTINGS_READY', onSettingsReady);
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

// Экспортируем вспомогательные модули для других частей приложения
export { SignalingService } from './signaling.service.js';
export { createSignalingMachine } from './signaling.machine.js';
