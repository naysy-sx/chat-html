// Actor Registry v2 — системный, реактивный, наблюдаемый

class ActorRegistry {
	constructor() {
		// id -> { actor, meta }
		this.actors = new Map();

		// id -> { spawned, stopped, errors: [] }
		this.stats = new Map();

		// (event) => void
		this.listeners = new Set();
	}

	/* ------------------------------------------------------------------ */
	/* Subscriptions                                                      */
	/* ------------------------------------------------------------------ */

	subscribe(listener) {
		this.listeners.add(listener);

		// initial sync
		listener({
			type: 'sync',
			actors: this.actors,
		});

		return () => {
			this.listeners.delete(listener);
		};
	}

	_emit(event) {
		for (const l of this.listeners) {
			try {
				l(event);
			} catch (e) {
				console.error('[ActorRegistry] listener error', e);
			}
		}
	}

	/* ------------------------------------------------------------------ */
	/* Core API                                                           */
	/* ------------------------------------------------------------------ */

	register(id, actor, meta = {}) {
		if (!id) throw new Error('Actor id is required');
		if (!actor) throw new Error('Actor instance is required');

		if (this.actors.has(id)) {
			this._internalUnregister(id, 'replaced');
		}

		const entry = {
			actor,
			meta: {
				...meta,
				id,
				type: meta.type || 'unknown',
				spawnedAt: Date.now(),
			},
		};

		this.actors.set(id, entry);
		this._updateStats(id, 'spawned');

		this._emit({
			type: 'registered',
			id,
			entry,
			actors: this.actors,
		});

		this._attachLifecycle(id, actor);

		return actor;
	}

	unregister(id) {
		return this._internalUnregister(id, 'manual');
	}

	get(id) {
		return this.actors.get(id)?.actor || null;
	}

	getEntry(id) {
		return this.actors.get(id) || null;
	}

	getAll(type) {
		return Array.from(this.actors.values())
			.filter((e) => !type || e.meta.type === type)
			.map((e) => e.actor);
	}

	has(id) {
		return this.actors.has(id);
	}

	clear() {
		for (const id of Array.from(this.actors.keys())) {
			this._internalUnregister(id, 'clear');
		}
	}

	/* ------------------------------------------------------------------ */
	/* Internals                                                          */
	/* ------------------------------------------------------------------ */

	_internalUnregister(id, reason = 'manual') {
		const entry = this.actors.get(id);
		if (!entry) return false;

		const { actor, meta } = entry;

		this.actors.delete(id);
		this._updateStats(id, 'stopped');

		// lifecycle
		if (typeof actor.stop === 'function') {
			try {
				actor.stop();
			} catch (e) {
				console.error(`[ActorRegistry] stop error (${id})`, e);
			}
		}

		const lifetime = Date.now() - meta.spawnedAt;

		this._emit({
			type: 'unregistered',
			id,
			entry,
			reason,
			lifetime,
			actors: this.actors,
		});

		console.debug(
			`[ActorRegistry] actor "${id}" stopped after ${lifetime}ms (${reason})`
		);

		return true;
	}

	_attachLifecycle(id, actor) {
		if (!actor?.subscribe) return;

		actor.subscribe({
			complete: () => {
				this._updateStats(id, 'stopped');
				this._internalUnregister(id, 'completed');
			},
			error: (err) => {
				this._updateStats(id, 'error', err);

				this._emit({
					type: 'error',
					id,
					error: err,
					entry: this.actors.get(id) || null,
				});

				this._internalUnregister(id, 'error');
			},
		});
	}

	/* ------------------------------------------------------------------ */
	/* Stats                                                              */
	/* ------------------------------------------------------------------ */

	_updateStats(id, event, error = null) {
		if (!this.stats.has(id)) {
			this.stats.set(id, { spawned: 0, stopped: 0, errors: [] });
		}

		const stats = this.stats.get(id);

		if (event === 'spawned') stats.spawned++;
		if (event === 'stopped') stats.stopped++;
		if (event === 'error' && error) stats.errors.push(error);
	}

	getStats() {
		return {
			active: this.actors.size,
			total: this.stats.size,
			byType: this._groupByType(),
		};
	}

	_groupByType() {
		const byType = {};

		for (const { meta } of this.actors.values()) {
			byType[meta.type] = (byType[meta.type] || 0) + 1;
		}

		return byType;
	}
}

export const actorRegistry = new ActorRegistry();
