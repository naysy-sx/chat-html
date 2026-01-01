// Bootstrap
import { featureRegistry } from "../core/feature-registry.js";
import { eventBus } from "../core/event-bus.js";
import { actorRegistry } from "../core/actor-registry.js";
import { appMachine, setMountContext } from "../core/app-machine.js";
import { createActor } from "xstate";

// Импортируем минимальные фичи
import { persistenceFeature } from "../features/persistence/index.js";
import { cryptoFeature } from "../features/crypto/index.js";
import { identityFeature } from "../features/identity/index.js";
import { authFeature } from "../features/auth/index.js";
import { shellFeature } from "../features/shell/index.js";

export async function bootstrap() {
	console.log("🚀 Bootstrapping application...");

	// 1. Регистрируем фичи
	// ПОРЯДОК НЕ ВАЖЕН! FeatureRegistry сам разберётся с зависимостями
	featureRegistry.register(persistenceFeature); // базовая фича без зависимостей
	featureRegistry.register(cryptoFeature); // базовая фича
	featureRegistry.register(identityFeature); // depends: persistence, crypto
	featureRegistry.register(authFeature); // depends: identity, persistence
	featureRegistry.register(shellFeature); // depends: auth (UI shell)

	// 2. Создаём контекст для фич
	const context = {
		eventBus,
		actorRegistry,
		featureRegistry,
	};

	// 3. Устанавливаем контекст для монтирования (через замыкание)
	setMountContext(context);

	// 4. Создаём root actor
	const appActor = createActor(appMachine, {
		input: context,
	});

	appActor.start();

	// 5. Подписываемся на критические события
	appActor.subscribe((snapshot) => {
		console.log("App state:", snapshot.value);

		if (snapshot.matches("ready")) {
			// Отправляем глобальное событие
			eventBus.dispatch({ type: "APP_READY" }, "HIGH");
		}
	});

	// 6. Ждём готовности
	await waitFor(appActor, (state) => state.matches("ready"));

	console.log("✅ Application ready!");

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
	});
}
