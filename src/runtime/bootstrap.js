import { featureRegistry } from '../core/feature-registry.js';
import { eventBus } from '../core/event-bus.js';
import { actorRegistry } from '../core/actor-registry.js';
import { appMachine, setMountContext } from '../core/app-machine.js';
import { createActor } from 'xstate';

// Импортируем фичи
import { persistenceFeature } from '../features/persistence/index.js';
import { identityFeature } from '../features/identity/index.js';
import { authFeature } from '../features/auth/index.js';
import { appSettingsFeature } from '../features/app-settings/index.js';
import { profileFeature } from '../features/profile/index.js';
import { signalingFeature } from '../features/signaling/index.js';
import { contactsFeature } from '../features/contacts/index.js';
import { shellFeature } from '../features/shell/index.js';

export async function bootstrap() {
	console.log('════════════════════════════════════════════');
	console.log('🚀 BOOTSTRAP FUNCTION CALLED');
	console.log('════════════════════════════════════════════');
	console.log('🚀 Загрузка приложения...');

	// 1. Регистрируем фичи
	console.log('📋 Registering features...');
	featureRegistry.register(persistenceFeature);
	console.log('  ✅ persistence registered');
	featureRegistry.register(identityFeature);
	console.log('  ✅ identity registered');
	featureRegistry.register(authFeature);
	console.log('  ✅ auth registered');
	featureRegistry.register(appSettingsFeature);
	console.log('  ✅ app-settings registered');
	featureRegistry.register(profileFeature);
	console.log('  ✅ profile registered');
	featureRegistry.register(signalingFeature);
	console.log('  ✅ signaling registered');
	featureRegistry.register(contactsFeature);
	console.log('  ✅ contacts registered');
	featureRegistry.register(shellFeature);
	console.log('  ✅ shell registered');
	console.log(
		'📋 All features registered:',
		featureRegistry.getAll().map((f) => f.id)
	);

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

	// 5. Подписываемся на изменения состояния
	appActor.subscribe((snapshot) => {
		console.log('📱 App state:', snapshot.value);

		if (snapshot.matches('ready')) {
			console.log('✅ App reached ready state');
			eventBus.dispatch({ type: 'APP_READY' }, 'HIGH');
		}

		if (snapshot.matches('error')) {
			console.error('💥 App error:', snapshot.context.error);
		}
	});

	// 6. Ждём готовности приложения с таймаутом
	try {
		await waitFor(appActor, (state) => state.matches('ready'), 30000);
		console.log('✅ Application ready!');
	} catch (err) {
		console.error('❌ App failed to reach ready state:', err);
		// Всё равно продолжаем — UI может работать
	}

	// Для отладки
	if (typeof window !== 'undefined') {
		window.appContext = context;
		window.appActor = appActor;
	}

	return { appActor, context };
}

/**
 * Ждёт пока actor достигнет определённого состояния
 * @param {Actor} actor
 * @param {Function} predicate
 * @param {number} timeout - таймаут в мс
 */
function waitFor(actor, predicate, timeout = 30000) {
	return new Promise((resolve, reject) => {
		// Таймаут
		const timeoutId = setTimeout(() => {
			sub.unsubscribe();
			reject(new Error(`Timeout waiting for state after ${timeout}ms`));
		}, timeout);

		// Проверяем сразу
		if (predicate(actor.getSnapshot())) {
			clearTimeout(timeoutId);
			resolve();
			return;
		}

		// Подписываемся
		const sub = actor.subscribe((snapshot) => {
			if (predicate(snapshot)) {
				clearTimeout(timeoutId);
				sub.unsubscribe();
				resolve();
			}
		});
	});
}
