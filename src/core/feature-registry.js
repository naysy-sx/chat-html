// Feature Registry
class FeatureRegistry {
	constructor() {
		this.features = new Map(); // id -> feature
		this.mounted = new Map(); // id -> mountResult
		this.dependencies = new Map(); // id -> [deps]
		this.context = null;
	}

	// Регистрация фичи
	register(feature) {
		if (this.features.has(feature.id)) {
			throw new Error(`Feature ${feature.id} already registered`);
		}

		// Валидация контракта
		this.validateFeature(feature);

		this.features.set(feature.id, feature);

		// Сохраняем зависимости
		if (feature.dependencies) {
			this.dependencies.set(feature.id, feature.dependencies);
		}

		// Вызываем onRegister
		if (feature.onRegister && this.context) {
			feature.onRegister(this.context);
		}

		console.log(`✅ Feature registered: ${feature.id}`);
	}

	setContext(context) {
		this.context = context;
	}

	// Монтирование фич (с учётом зависимостей)
	async mountAll(context) {
		this.setContext(context);
		const sorted = this.topologicalSort();

		for (const featureId of sorted) {
			await this.mount(featureId, context);
		}
	}

	async mount(featureId, context) {
		const feature = this.features.get(featureId);
		if (!feature) {
			throw new Error(`Feature ${featureId} not found`);
		}

		if (this.mounted.has(featureId)) {
			return; // уже смонтирована
		}

		// Проверяем зависимости
		if (feature.dependencies) {
			for (const depId of feature.dependencies) {
				if (!this.mounted.has(depId)) {
					await this.mount(depId, context);
				}
			}
		}

		console.log(`⬆️ Mounting feature: ${featureId}`);

		const result = await feature.onMount(context);
		this.mounted.set(featureId, result || {});

		// Подписываемся на события
		if (feature.subscribedEvents && context.eventBus) {
			this.subscribeToEvents(feature, context.eventBus);
		}
	}

	async unmountAll() {
		// Размонтируем в обратном порядке
		const sorted = this.topologicalSort().reverse();

		for (const featureId of sorted) {
			await this.unmount(featureId);
		}
	}

	async unmount(featureId) {
		const feature = this.features.get(featureId);
		const mountResult = this.mounted.get(featureId);

		if (!mountResult) return;

		console.log(`⬇️ Unmounting feature: ${featureId}`);

		if (feature.onUnmount && this.context) {
			await feature.onUnmount({ ...this.context, ...mountResult });
		}

		this.mounted.delete(featureId);
	}

	subscribeToEvents(feature, eventBus) {
		for (const eventType of feature.subscribedEvents) {
			eventBus.on(eventType, (event) => {
				// Отправляем событие актору фичи
				const mountResult = this.mounted.get(feature.id);
				if (mountResult?.actor) {
					mountResult.actor.send(event);
				}
			});
		}
	}

	// Топологическая сортировка по зависимостям
	topologicalSort() {
		const sorted = [];
		const visited = new Set();
		const visiting = new Set();

		const visit = (featureId) => {
			if (visited.has(featureId)) return;

			if (visiting.has(featureId)) {
				throw new Error(`Circular dependency detected: ${featureId}`);
			}

			visiting.add(featureId);

			const deps = this.dependencies.get(featureId) || [];
			for (const depId of deps) {
				if (!this.features.has(depId)) {
					throw new Error(
						`Feature ${featureId} depends on ${depId}, but ${depId} is not registered`
					);
				}
				visit(depId);
			}

			visiting.delete(featureId);
			visited.add(featureId);
			sorted.push(featureId);
		};

		for (const featureId of this.features.keys()) {
			visit(featureId);
		}

		return sorted;
	}

	validateFeature(feature) {
		if (!feature.id || !feature.name) {
			throw new Error("Feature must have id and name");
		}

		if (!feature.onMount) {
			throw new Error(`Feature ${feature.id} must have onMount`);
		}
	}

	// Утилиты
	get(featureId) {
		return this.features.get(featureId);
	}

	has(featureId) {
		return this.features.has(featureId);
	}

	isMounted(featureId) {
		return this.mounted.has(featureId);
	}

	getAll() {
		return Array.from(this.features.values());
	}

	getMountResult(featureId) {
		return this.mounted.get(featureId);
	}
}

export const featureRegistry = new FeatureRegistry();
