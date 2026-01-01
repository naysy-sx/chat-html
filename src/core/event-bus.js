// Priority Event Bus
class PriorityEventBus extends EventTarget {
	constructor() {
		super();
		this.queues = {
			HIGH: [],
			MEDIUM: [],
			LOW: [],
			DROPPED: [],
		};
		this.limits = {
			HIGH: 1000,
			MEDIUM: 500,
			LOW: 100,
		};
		this.processing = false;
		this.stats = { dropped: 0, processed: 0 };
		this.frameStart = performance.now();
	}

	dispatch(event, priority = "MEDIUM") {
		// Backpressure: если очередь переполнена
		if (this.queues[priority].length > this.limits[priority]) {
			if (this.canDrop(priority)) {
				this.queues.DROPPED.push(event);
				this.stats.dropped++;
				return;
			}
		}

		this.queues[priority].push(event);
		this.scheduleProcess();
	}

	canDrop(priority) {
		// TYPING, PRESENCE можно терять
		return ["LOW"].includes(priority);
	}

	hasEvents() {
		return (
			this.queues.HIGH.length > 0 ||
			this.queues.MEDIUM.length > 0 ||
			this.queues.LOW.length > 0
		);
	}

	getNextEvent() {
		if (this.queues.HIGH.length > 0) {
			return this.queues.HIGH.shift();
		}
		if (this.queues.MEDIUM.length > 0) {
			return this.queues.MEDIUM.shift();
		}
		if (this.queues.LOW.length > 0) {
			return this.queues.LOW.shift();
		}
		return null;
	}

	async scheduleProcess() {
		if (this.processing) return;

		this.processing = true;
		this.frameStart = performance.now();

		// Обрабатываем по приоритету
		while (this.hasEvents()) {
			const event = this.getNextEvent();
			if (!event) break;

			// Проверяем бюджет
			if (performance.now() - this.frameStart > 10) {
				// Освобождаем thread для рендеринга
				await new Promise((resolve) => setTimeout(resolve, 0));
				this.frameStart = performance.now();
			}

			// Отправляем событие
			this.dispatchEvent(
				new CustomEvent(event.type || "event", { detail: event })
			);
			this.stats.processed++;
		}

		this.processing = false;
	}

	// Удобный метод для подписки
	on(eventType, handler) {
		this.addEventListener(eventType, (e) => {
			handler(e.detail || e);
		});
	}

	off(eventType, handler) {
		this.removeEventListener(eventType, handler);
	}
}

export const eventBus = new PriorityEventBus();
