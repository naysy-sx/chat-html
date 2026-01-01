// Actor Registry
class ActorRegistry {
	constructor() {
		this.actors = new Map(); // id → { actor, meta }
		this.stats = new Map(); // id → { spawned, stopped, errors }
	}

	register(id, actor, meta = {}) {
		if (this.actors.has(id)) {
			console.warn(`Actor ${id} already registered, stopping old instance`);
			this.unregister(id);
		}

		this.actors.set(id, {
			actor,
			meta: {
				...meta,
				spawnedAt: Date.now(),
				type: meta.type || "unknown",
			},
		});

		this.updateStats(id, "spawned");

		// Автоматический cleanup при stop
		if (actor.subscribe) {
			actor.subscribe({
				complete: () => this.unregister(id),
				error: (err) => {
					this.updateStats(id, "error", err);
					this.unregister(id);
				},
			});
		}
	}

	unregister(id) {
		const entry = this.actors.get(id);
		if (!entry) return;

		const { actor, meta } = entry;

		// Вызываем cleanup
		if (typeof actor.stop === "function") {
			actor.stop();
		}

		this.updateStats(id, "stopped");
		this.actors.delete(id);

		// Логируем для debugging
		const lifetime = Date.now() - meta.spawnedAt;
		console.debug(`Actor ${id} stopped after ${lifetime}ms`);
	}

	get(id) {
		return this.actors.get(id)?.actor;
	}

	getAll(type) {
		return Array.from(this.actors.values())
			.filter(({ meta }) => !type || meta.type === type)
			.map(({ actor }) => actor);
	}

	updateStats(id, event, error = null) {
		if (!this.stats.has(id)) {
			this.stats.set(id, { spawned: 0, stopped: 0, errors: [] });
		}
		const stats = this.stats.get(id);
		if (event === "spawned") stats.spawned++;
		if (event === "stopped") stats.stopped++;
		if (event === "error" && error) stats.errors.push(error);
	}

	getStats() {
		return {
			active: this.actors.size,
			total: this.stats.size,
			byType: this.groupByType(),
		};
	}

	groupByType() {
		const byType = {};
		for (const { meta } of this.actors.values()) {
			byType[meta.type] = (byType[meta.type] || 0) + 1;
		}
		return byType;
	}
}

export const actorRegistry = new ActorRegistry();
