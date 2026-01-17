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
		console.log('═══════════════════════════════════════════════');
		console.log('🔧 MOUNTING ALL FEATURES');
		console.log('📋 Sorted order:', sorted);
		console.log('═══════════════════════════════════════════════');

		for (const featureId of sorted) {
			console.log(`\n  ⬆️  Mounting: ${featureId}...`);
			await this.mount(featureId, context);
			console.log(`  ✅ Mounted: ${featureId}`);
		}
		console.log('\n═══════════════════════════════════════════════');
		console.log('🎉 ALL FEATURES MOUNTED SUCCESSFULLY');
		console.log('═══════════════════════════════════════════════\n');
	}

	async mount(featureId, context) {
		const feature = this.features.get(featureId);
		if (!feature) {
			console.error(`❌ Feature ${featureId} not found in registry!`);
			throw new Error(`Feature ${featureId} not found`);
		}

		if (this.mounted.has(featureId)) {
			console.log(`⏭️ Feature ${featureId} already mounted, skipping`);
			return; // уже смонтирована
		}

		// Проверяем зависимости
		if (feature.dependencies) {
			console.log(
				`🔧 Feature ${featureId} has dependencies:`,
				feature.dependencies
			);
			for (const depId of feature.dependencies) {
				if (!this.mounted.has(depId)) {
					console.log(`🔧 Mounting dependency ${depId} before ${featureId}`);
					await this.mount(depId, context);
				}
			}
		}

		console.log(`⬆️ Mounting feature: ${featureId}`);

		try {
			const result = await feature.onMount(context);
			console.log(`     ✅ onMount() completed, result:`, result);
			this.mounted.set(featureId, result || {});
		} catch (err) {
			console.error(`\n  ❌❌❌ ERROR mounting ${featureId}:`, err);
			console.error(`     Error message: ${err.message}`);
			console.error(`     Stack: ${err.stack}`);
			throw err;
		}

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
			throw new Error('Feature must have id and name');
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
