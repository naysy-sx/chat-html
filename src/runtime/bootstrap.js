// src/runtime/bootstrap.js

import { featureRegistry } from '../core/feature-registry.js';
import { eventBus } from '../core/event-bus.js';
import { actorRegistry } from '../core/actor-registry.js';
import { appMachine, setMountContext } from '../core/app-machine.js';
import { createActor } from 'xstate';

// Импортируем фичи
import { persistenceFeature } from '../features/persistence/index.js';
import { identityFeature } from '../features/identity/index.js';
import { authFeature } from '../features/auth/index.js';
import { settingsFeature } from '../features/settings/index.js'; // ← НОВОЕ
import { shellFeature } from '../features/shell/index.js';

export async function bootstrap() {
	console.log('🚀 Загрузка приложения...');

	// 1. Регистрируем фичи (порядок не критичен - Feature Registry сам сортирует по зависимостям)
	featureRegistry.register(persistenceFeature); // Базовая фича, без зависимостей
	// identityFeature временно оставляем для совместимости, но больше не используется
	// featureRegistry.register(identityFeature);
	featureRegistry.register(authFeature); // Зависит ТОЛЬКО от persistence, создаёт свой crypto service
	featureRegistry.register(settingsFeature); // Зависит от persistence, auth
	featureRegistry.register(shellFeature); // Зависит от auth

	// 2. Создаём контекст для фич
	const context = {
		eventBus,
		actorRegistry,
		featureRegistry,
	};

	// 3. Устанавливаем контекст для монтирования
	setMountContext(context);

	// 4. Создаём root actor
	const appActor = createActor(appMachine, {
		input: context,
	});
	appActor.start();

	// 5. Подписываемся на критические события
	appActor.subscribe((snapshot) => {
		console.log('Состояние приложения:', snapshot.value);

		if (snapshot.matches('ready')) {
			eventBus.dispatch({ type: 'APP_READY' }, 'HIGH');
		}

		if (snapshot.matches('error')) {
			console.error('💥 App error:', snapshot.context.error);
		}
	});

	// 6. Ждём готовности приложения
	await waitFor(appActor, (state) => state.matches('ready'));
	console.log('✅ Application ready!');

	// Для отладки
	if (typeof window !== 'undefined') {
		window.appContext = context;
		window.appActor = appActor;
	}

	return { appActor, context };
}

function waitFor(actor, predicate) {
	return new Promise((resolve) => {
		const sub = actor.subscribe((snapshot) => {
			if (predicate(snapshot)) {
				sub.unsubscribe();
				resolve();
			}
		});
		if (predicate(actor.getSnapshot())) {
			sub.unsubscribe();
			resolve();
		}
	});
}
