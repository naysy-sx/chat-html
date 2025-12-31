# 🏗️ Финальная архитектура Chat v0.3 (Production-Ready)

**XState + Lit + mcss | Single-file HTML | Event-driven | Pure JavaScript**

Дата: 2025-01-01  
Версия: 0.3.0 (Production-Ready)

---

## 📋 Оглавление

1. [Принципы архитектуры](#принципы-архитектуры)
2. [Исполнительная модель](#исполнительная-модель)
3. [Структура машин](#структура-машин)
4. [Lifecycle Management](#lifecycle-management)
5. [Error Handling & Recovery](#error-handling--recovery)
6. [Performance & Backpressure](#performance--backpressure)
7. [Observability](#observability)
8. [Startup Strategies](#startup-strategies)
9. [Services](#services)
10. [UI Components](#ui-components)
11. [Deployment](#deployment)

---

## 🎯 Принципы архитектуры

### 1. Разделение ответственности

**XState (State Management):**

- Бизнес-логика и поведение
- Допустимые состояния и переходы
- Маршрутизация событий
- Асинхронные процессы (invoke)

**Services (Domain Logic):**

- Криптографические алгоритмы
- Хранилище данных
- Сетевое взаимодействие
- Медиа-обработка

**Workers (Execution):**

- Тяжёлые вычисления
- Блокирующие операции
- Изоляция от main thread

**UI Components (Presentation):**

- Рендеринг
- Пользовательский ввод
- Визуальная обратная связь

### 2. Коммуникация

```
┌─────────────────────────────────────────┐
│           AppMachine (root)             │
│  ┌───────────────────────────────────┐  │
│  │       EventBus (Priority)         │  │
│  │  HIGH | MEDIUM | LOW | DROPPED    │  │
│  └───────────────────────────────────┘  │
│                   ↓                      │
│  ┌─────────────┐ ┌──────────────────┐  │
│  │  Machine A  │ │   Machine B      │  │
│  │  spawn()    │ │   invoke()       │  │
│  └─────────────┘ └──────────────────┘  │
└─────────────────────────────────────────┘
         ↓                      ↓
   ┌──────────┐          ┌──────────┐
   │  Worker  │          │  Service │
   └──────────┘          └──────────┘
```

**Правила:**

- ❌ НЕТ прямых вызовов между машинами
- ✅ ТОЛЬКО события через родителя или EventBus
- ✅ Workers изолированы, общаются через postMessage
- ✅ Services — чистые функции или Promise-based API

### 3. Actor Model с управлением жизненным циклом

```javascript
// Каждый диалог/группа = отдельный актор
const conversationActor = spawn(conversationMachine, {
	id: `conversation-${contactId}`,
	systemId: `conv-${contactId}`, // для отладки
	// автоматический cleanup при stop()
});

// Lifecycle hooks
conversationActor.subscribe({
	next: (snapshot) => {
		/* state change */
	},
	error: (err) => {
		/* handle error */
	},
	complete: () => {
		/* cleanup */
	},
});
```

---

## ⚙️ Исполнительная модель

### 1. Thread Budget

| Задача            | Где выполняется | Время   | Приоритет |
| ----------------- | --------------- | ------- | --------- |
| UI рендеринг      | Main thread     | < 16ms  | CRITICAL  |
| FSM transitions   | Main thread     | < 1ms   | HIGH      |
| Crypto (encrypt)  | CryptoWorker    | < 100ms | HIGH      |
| Crypto (decrypt)  | CryptoWorker    | < 100ms | HIGH      |
| Media compression | MediaWorker     | < 500ms | MEDIUM    |
| IndexedDB write   | Main (batched)  | < 50ms  | MEDIUM    |
| IndexedDB read    | Main (cached)   | < 20ms  | HIGH      |
| Network (send)    | Main (async)    | любое   | HIGH      |
| Typing indicator  | Main            | < 5ms   | LOW       |

### 2. Worker Architecture

```
Main Thread
├─ AppMachine (orchestrator)
├─ UI Components (Lit)
└─ EventBus (priority queue)
    ↓
Workers:
├─ CryptoWorker (shared)
│  ├─ generateKeyPair()
│  ├─ encrypt()
│  └─ decrypt()
├─ MediaWorker (dedicated per operation)
│  ├─ compressImage()
│  ├─ convertVideo()
│  └─ generateThumbnail()
└─ StorageWorker (optional, для больших операций)
   └─ batchWrite()
```

**Принцип:**

- CryptoWorker — **shared**, т.к. операции короткие
- MediaWorker — **dedicated**, т.к. операции длительные
- StorageWorker — **опционально**, только для batch операций

### 3. Event Priority Queue

```javascript
class PriorityEventBus extends EventTarget {
	constructor() {
		super();
		this.queues = {
			HIGH: [], // MESSAGE_RECEIVED, CRYPTO_DONE
			MEDIUM: [], // CONTACT_REQUEST, PROFILE_UPDATE
			LOW: [], // TYPING, PRESENCE
			DROPPED: [], // для аналитики
		};
		this.processing = false;
		this.stats = { dropped: 0, processed: 0 };
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

	async scheduleProcess() {
		if (this.processing) return;

		this.processing = true;

		// Обрабатываем по приоритету
		while (this.hasEvents()) {
			const event = this.getNextEvent(); // HIGH → MEDIUM → LOW

			// Проверяем бюджет
			if (performance.now() - this.frameStart > 10) {
				// Освобождаем thread для рендеринга
				await nextTick();
				this.frameStart = performance.now();
			}

			this.dispatchEvent(event);
			this.stats.processed++;
		}

		this.processing = false;
	}
}
```

**Лимиты очередей:**

- HIGH: 1000 событий
- MEDIUM: 500 событий
- LOW: 100 событий (с автодропом)

### 4. Batching Strategy

```javascript
// Группировка MESSAGE_RECEIVED
const messageBatcher = {
	buffer: new Map(), // contactId → messages[]
	timer: null,

	add(contactId, message) {
		if (!this.buffer.has(contactId)) {
			this.buffer.set(contactId, []);
		}
		this.buffer.get(contactId).push(message);

		// Flush через 100ms или при 10 сообщениях
		if (this.buffer.get(contactId).length >= 10) {
			this.flush(contactId);
		} else {
			this.scheduleFresh();
		}
	},

	flush(contactId) {
		const messages = this.buffer.get(contactId);
		if (!messages?.length) return;

		eventBus.dispatch(
			{
				type: "MESSAGES_BATCH_RECEIVED",
				contactId,
				messages,
			},
			"HIGH"
		);

		this.buffer.delete(contactId);
	},
};
```

---

## 🏗️ Структура машин

```
AppMachine (root)
├─ runtime (parallel) ────────────────┐
│  ├─ lifecycle                       │ НОВОЕ
│  ├─ errorBoundary                   │ НОВОЕ
│  └─ instrumentation                 │ НОВОЕ
├─ boot
│  ├─ detecting (cold/warm/offline)   │ НОВОЕ
│  └─ restoring
└─ authenticated (parallel)
    ├─ shell
    ├─ auth
    ├─ identity
    ├─ contacts
    ├─ signaling
    ├─ sync
    ├─ crypto
    ├─ chat
    ├─ groups
    ├─ streams
    ├─ modals
    ├─ notifications
    └─ persistence
```

---

## 🔄 Lifecycle Management

### 1. Actor Lifecycle Contract

**Каждый actor обязан реализовать:**

```javascript
const actorContract = {
	// При создании
	onMount: () => {
		// подписки на EventBus
		// инициализация таймеров
		// загрузка начальных данных
	},

	// При уничтожении
	onUnmount: () => {
		// отписки от EventBus
		// остановка таймеров
		// отмена pending invokes (AbortController)
		// сохранение критичного состояния
	},

	// При фоновом режиме
	onBackground: () => {
		// pause polling
		// throttle updates
	},

	// При возврате
	onForeground: () => {
		// resume polling
		// sync missed events
	},
};
```

### 2. LifecycleMachine (новое)

**Файл:** `src/machines/lifecycle.machine.js`

```javascript
LifecycleMachine
├─ active
│  ├─ foreground
│  │  └─ on VISIBILITY_HIDDEN → background
│  └─ background
│     ├─ throttled (5s heartbeat вместо 1s)
│     └─ on VISIBILITY_VISIBLE → foreground
├─ suspended (tab frozen)
│  └─ on RESUME → active
└─ terminated (forced cleanup)
```

**События:**

```javascript
// VISIBILITY_HIDDEN (from document)
{ type: 'VISIBILITY_HIDDEN' }

// VISIBILITY_VISIBLE (from document)
{ type: 'VISIBILITY_VISIBLE' }

// BEFORE_UNLOAD (from window)
{ type: 'BEFORE_UNLOAD' }

// MEMORY_PRESSURE (from performance API)
{
  type: 'MEMORY_PRESSURE',
  level: 'high' // 'low' | 'medium' | 'high'
}
```

**Действия:**

```javascript
// При переходе в background
actions: {
  pauseNonCriticalActors: (context) => {
    // Останавливаем typing indicators
    // Throttle presence updates
    // Pause media processing
  },

  saveState: (context) => {
    // Сохраняем критичные данные в IndexedDB
  },

  releaseMemory: (context) => {
    // Очищаем кэши
    // Останавливаем неактивные conversation actors
  }
}
```

### 3. Actor Registry (новое)

```javascript
// src/runtime/actor-registry.js

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
		actor.subscribe({
			complete: () => this.unregister(id),
			error: (err) => {
				this.updateStats(id, "error", err);
				this.unregister(id);
			},
		});
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
			.filter(({ meta }) => meta.type === type)
			.map(({ actor }) => actor);
	}

	cleanup(criteria) {
		// Очистка по критериям: старые, неактивные, etc.
		const now = Date.now();

		for (const [id, { meta }] of this.actors) {
			if (criteria.maxAge && now - meta.spawnedAt > criteria.maxAge) {
				this.unregister(id);
			}

			if (criteria.type && meta.type === criteria.type) {
				this.unregister(id);
			}
		}
	}

	getStats() {
		return {
			active: this.actors.size,
			total: this.stats.size,
			byType: this.groupByType(),
			errors: this.getErrors(),
		};
	}
}

// Глобальный singleton
export const actorRegistry = new ActorRegistry();
```

**Использование:**

```javascript
// В ChatMachine
const conversationActor = spawn(conversationMachine, {
	id: `conversation-${contactId}`,
});

actorRegistry.register(`conversation-${contactId}`, conversationActor, {
	type: "conversation",
	contactId,
});

// При закрытии диалога
actorRegistry.unregister(`conversation-${contactId}`);

// Периодическая очистка (в LifecycleMachine)
actorRegistry.cleanup({
	maxAge: 30 * 60 * 1000, // 30 минут
	type: "conversation",
});
```

---

## 🚨 Error Handling & Recovery

### 1. Error Taxonomy

```javascript
// Классификация ошибок
const ErrorTypes = {
	// Локальные (recoverable)
	VALIDATION: "validation", // неверный ввод
	NETWORK_TIMEOUT: "network_timeout", // timeout запроса
	CRYPTO_FAILED: "crypto_failed", // decrypt failed

	// Доменные (restartable)
	STORAGE_QUOTA: "storage_quota", // IndexedDB переполнен
	CONTACT_NOT_FOUND: "contact_not_found",
	MESSAGE_TOO_LARGE: "message_too_large",

	// Системные (fatal)
	WORKER_CRASHED: "worker_crashed",
	DB_CORRUPTED: "db_corrupted",
	MEMORY_EXHAUSTED: "memory_exhausted",

	// Неизвестные (isolation)
	UNKNOWN: "unknown",
};

const ErrorSeverity = {
	LOW: "low", // можно игнорировать
	MEDIUM: "medium", // показать уведомление
	HIGH: "high", // требует действия пользователя
	CRITICAL: "critical", // logout / safe mode
};
```

### 2. ErrorBoundaryMachine (новое)

**Файл:** `src/machines/error-boundary.machine.js`

```javascript
ErrorBoundaryMachine
├─ healthy
├─ degraded (частичная работа)
│  ├─ retrying (exponential backoff)
│  └─ isolated (отключён проблемный модуль)
├─ safeMode (только чтение)
└─ failed (требуется reload)
```

**Контекст:**

```javascript
{
  errors: [],          // Error[] с метаданными
  failedModules: [],   // string[] - какие машины сломаны
  retryAttempts: {},   // moduleId → number
  lastError: null      // Error | null
}
```

**События:**

```javascript
// ERROR_OCCURRED
{
  type: 'ERROR_OCCURRED',
  error: new Error('...'),
  source: 'ChatMachine',  // где произошла
  severity: 'MEDIUM',
  recoverable: true,
  context: { /* дополнительная информация */ }
}

// RECOVERY_SUCCEEDED
{
  type: 'RECOVERY_SUCCEEDED',
  source: 'ChatMachine'
}

// RECOVERY_FAILED
{
  type: 'RECOVERY_FAILED',
  source: 'ChatMachine',
  attempts: 3
}

// ISOLATE_MODULE
{
  type: 'ISOLATE_MODULE',
  moduleId: 'groups'
}

// ENTER_SAFE_MODE
{ type: 'ENTER_SAFE_MODE' }
```

**Recovery strategies:**

```javascript
const recoveryStrategies = {
	// Локальные ошибки
	[ErrorTypes.VALIDATION]: {
		action: "retry",
		maxAttempts: 0, // не retry, показать ошибку
		fallback: "showError",
	},

	[ErrorTypes.NETWORK_TIMEOUT]: {
		action: "retry",
		maxAttempts: 3,
		backoff: "exponential", // 1s, 2s, 4s
		fallback: "queueOffline",
	},

	[ErrorTypes.CRYPTO_FAILED]: {
		action: "retry",
		maxAttempts: 1,
		fallback: "skipMessage", // не можем расшифровать → пропускаем
	},

	// Доменные ошибки
	[ErrorTypes.STORAGE_QUOTA]: {
		action: "cleanup",
		strategy: "deleteOldMessages",
		fallback: "readOnlyMode",
	},

	[ErrorTypes.MESSAGE_TOO_LARGE]: {
		action: "compress",
		fallback: "reject",
	},

	// Системные ошибки
	[ErrorTypes.WORKER_CRASHED]: {
		action: "restart",
		maxAttempts: 2,
		fallback: "mainThreadFallback",
	},

	[ErrorTypes.DB_CORRUPTED]: {
		action: "rebuild",
		fallback: "safeMode",
	},

	[ErrorTypes.MEMORY_EXHAUSTED]: {
		action: "releaseMemory",
		fallback: "logout",
	},

	// Неизвестные
	[ErrorTypes.UNKNOWN]: {
		action: "isolate",
		fallback: "safeMode",
	},
};
```

### 3. Error Propagation

```
ConversationActor (error: crypto_failed)
       ↓
ChatMachine (tries recovery)
       ↓ (if failed)
ErrorBoundaryMachine (evaluates severity)
       ↓
       ├─ LOW/MEDIUM → isolate conversation
       ├─ HIGH → disable chat module
       └─ CRITICAL → safe mode
```

**Пример:**

```javascript
// В ConversationMachine
actions: {
  handleDecryptError: (context, event) => {
    sendParent({
      type: 'ERROR_OCCURRED',
      error: event.error,
      source: 'ConversationActor',
      severity: 'MEDIUM',
      recoverable: false, // не можем расшифровать
      context: {
        contactId: context.contactId,
        messageId: event.messageId
      }
    })
  }
}

// В ChatMachine
on: {
  ERROR_OCCURRED: {
    actions: [(context, event) => {
      const { source, severity } = event

      if (severity === 'MEDIUM') {
        // Пытаемся изолировать актор
        const actor = context.activeConversations.get(event.context.contactId)
        if (actor) {
          actor.stop()
          context.activeConversations.delete(event.context.contactId)
        }
      }

      // Пробрасываем наверх
      sendParent(event)
    }]
  }
}

// В ErrorBoundaryMachine
on: {
  ERROR_OCCURRED: {
    target: 'degraded',
    actions: ['logError', 'notifyUser', 'attemptRecovery']
  }
}
```

---

## ⚡ Performance & Backpressure

### 1. Throttling & Debouncing

```javascript
// src/runtime/rate-limiters.js

export const rateLimiters = {
	// Typing indicator: макс 1 событие / 500ms
	typing: throttle((contactId) => {
		eventBus.dispatch(
			{
				type: "PEER_TYPING",
				contactId,
			},
			"LOW"
		);
	}, 500),

	// Presence updates: макс 1 / 5s
	presence: throttle((userId, status) => {
		eventBus.dispatch(
			{
				type: "PRESENCE_CHANGED",
				userId,
				status,
			},
			"LOW"
		);
	}, 5000),

	// Scroll load more: debounce 300ms
	loadMore: debounce((conversationId) => {
		eventBus.dispatch(
			{
				type: "LOAD_MORE_MESSAGES",
				conversationId,
			},
			"MEDIUM"
		);
	}, 300),

	// Search: debounce 500ms
	search: debounce((query) => {
		eventBus.dispatch(
			{
				type: "SEARCH",
				query,
			},
			"MEDIUM"
		);
	}, 500),
};
```

### 2. Memory Pressure Handling

```javascript
// src/runtime/memory-manager.js

class MemoryManager {
	constructor() {
		this.threshold = {
			low: 100 * 1024 * 1024, // 100MB
			medium: 50 * 1024 * 1024, // 50MB
			high: 20 * 1024 * 1024, // 20MB
		};

		this.caches = new Map(); // cacheName → WeakMap

		this.startMonitoring();
	}

	startMonitoring() {
		if ("memory" in performance) {
			setInterval(() => {
				const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
				const available = jsHeapSizeLimit - usedJSHeapSize;

				if (available < this.threshold.high) {
					this.handlePressure("high");
				} else if (available < this.threshold.medium) {
					this.handlePressure("medium");
				}
			}, 10000); // каждые 10 секунд
		}
	}

	handlePressure(level) {
		console.warn(`Memory pressure: ${level}`);

		eventBus.dispatch(
			{
				type: "MEMORY_PRESSURE",
				level,
			},
			"HIGH"
		);

		switch (level) {
			case "medium":
				this.clearCaches(["thumbnails", "previews"]);
				break;

			case "high":
				this.clearCaches();
				actorRegistry.cleanup({ maxAge: 5 * 60 * 1000 }); // 5 минут
				break;
		}
	}

	clearCaches(names = null) {
		if (names) {
			names.forEach((name) => this.caches.delete(name));
		} else {
			this.caches.clear();
		}
	}

	registerCache(name, cache) {
		this.caches.set(name, cache);
	}
}

export const memoryManager = new MemoryManager();
```

### 3. IndexedDB Batching

```javascript
// src/services/storage.service.js (обновлённое)

class StorageService {
	constructor() {
		this.writeQueue = [];
		this.flushTimer = null;
		this.flushInterval = 100; // 100ms
		this.maxBatchSize = 50;
	}

	async write(key, value) {
		return new Promise((resolve, reject) => {
			this.writeQueue.push({ key, value, resolve, reject });

			if (this.writeQueue.length >= this.maxBatchSize) {
				this.flush();
			} else {
				this.scheduleFlush();
			}
		});
	}

	scheduleFlush() {
		if (this.flushTimer) return;

		this.flushTimer = setTimeout(() => {
			this.flush();
		}, this.flushInterval);
	}

	async flush() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		if (this.writeQueue.length === 0) return;

		const batch = this.writeQueue.splice(0);

		const db = await this.getDB();
		const tx = db.transaction(["store"], "readwrite");
		const store = tx.objectStore("store");

		// Параллельные записи в одной транзакции
		const promises = batch.map(({ key, value, resolve, reject }) => {
			const request = store.put({ key, value });
			return new Promise((res, rej) => {
				request.onsuccess = () => resolve(res());
				request.onerror = () => reject(rej(request.error));
			});
		});

		try {
			await Promise.all(promises);
			await tx.complete;
		} catch (err) {
			console.error("Batch write failed:", err);

			// Пытаемся записать по одному
			for (const item of batch) {
				try {
					await this.writeSingle(item.key, item.value);
					item.resolve();
				} catch (e) {
					item.reject(e);
				}
			}
		}
	}
}
```

---

## 📊 Observability

### 1. InstrumentationMachine (новое)

**Файл:** `src/machines/instrumentation.machine.js`

```javascript
InstrumentationMachine
├─ collecting
│  ├─ metrics (counters, timers, gauges)
│  ├─ traces (transition logs)
│  └─ events (raw events)
├─ analyzing (каждые 60s)
│  └─ generateReport()
└─ reporting
    └─ displayStats() или sendToAnalytics()
```

**Контекст:**

```javascript
{
  metrics: {
    counters: {},      // eventType → count
    timers: {},        // operationType → duration[]
    gauges: {}         // metricName → currentValue
  },

  traces: [],          // TransitionLog[]

  performance: {
    fps: [],           // последние 60 значений
    memoryUsage: [],
    eventQueueSize: []
  },

  errors: {
    byType: {},        // errorType → count
    bySource: {}       // source → count
  }
}
```

### 2. Transition Logging

```javascript
// src/runtime/logger.js

class TransitionLogger {
	constructor() {
		this.buffer = [];
		this.maxSize = 1000;
	}

	log(machineId, transition) {
		const entry = {
			timestamp: Date.now(),
			machineId,
			from: transition.from,
			to: transition.to,
			event: transition.event,
			duration: transition.duration || 0,
		};

		this.buffer.push(entry);

		if (this.buffer.length > this.maxSize) {
			this.buffer.shift(); // удаляем старые
		}

		// Отправляем в InstrumentationMachine
		eventBus.dispatch(
			{
				type: "TRANSITION_LOGGED",
				entry,
			},
			"LOW"
		);
	}

	getTrace(machineId, limit = 100) {
		return this.buffer.filter((e) => e.machineId === machineId).slice(-limit);
	}

	analyze() {
		// Находим самые медленные переходы
		const slow = this.buffer
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10);

		// Находим самые частые события
		const frequent = Object.entries(
			this.buffer.reduce((acc, e) => {
				acc[e.event.type] = (acc[e.event.type] || 0) + 1;
				return acc;
			}, {})
		).sort((a, b) => b[1] - a[1]);

		return { slow, frequent };
	}
}

export const transitionLogger = new TransitionLogger();
```

### 3. Metrics Collection

```javascript
// src/runtime/metrics.js

class MetricsCollector {
	constructor() {
		this.counters = {};
		this.timers = {};
		this.gauges = {};
	}

	increment(name, value = 1, tags = {}) {
		const key = this.buildKey(name, tags);
		this.counters[key] = (this.counters[key] || 0) + value;
	}

	timing(name, duration, tags = {}) {
		const key = this.buildKey(name, tags);
		if (!this.timers[key]) {
			this.timers[key] = [];
		}
		this.timers[key].push(duration);
	}

	gauge(name, value, tags = {}) {
		const key = this.buildKey(name, tags);
		this.gauges[key] = value;
	}

	buildKey(name, tags) {
		const tagStr = Object.entries(tags)
			.map(([k, v]) => `${k}:${v}`)
			.join(",");
		return tagStr ? `${name}{${tagStr}}` : name;
	}

	getStats() {
		return {
			counters: this.counters,
			timers: Object.entries(this.timers).reduce((acc, [key, values]) => {
				acc[key] = {
					count: values.length,
					min: Math.min(...values),
					max: Math.max(...values),
					avg: values.reduce((a, b) => a + b, 0) / values.length,
					p50: this.percentile(values, 0.5),
					p95: this.percentile(values, 0.95),
					p99: this.percentile(values, 0.99),
				};
				return acc;
			}, {}),
			gauges: this.gauges,
		};
	}

	percentile(values, p) {
		const sorted = values.slice().sort((a, b) => a - b);
		const index = Math.ceil(sorted.length * p) - 1;
		return sorted[index];
	}

	reset() {
		this.counters = {};
		this.timers = {};
		// gauges не сбрасываем, т.к. они текущее состояние
	}
}

export const metrics = new MetricsCollector();
```

**Использование:**

```javascript
// Пример: измерение времени шифрования
const startTime = performance.now();

const encrypted = await cryptoService.encrypt(plaintext, recipientPublicKey);

const duration = performance.now() - startTime;
metrics.timing("crypto.encrypt", duration, {
	algorithm: "AES-GCM",
});

// Пример: счётчик сообщений
metrics.increment("messages.sent", 1, {
	type: "text",
});

// Пример: gauge размера очереди
metrics.gauge("eventBus.queueSize", eventBus.queues.HIGH.length);
```

### 4. Performance Monitoring

```javascript
// src/runtime/performance-monitor.js

class PerformanceMonitor {
	constructor() {
		this.fpsHistory = [];
		this.lastFrameTime = performance.now();

		this.startMonitoring();
	}

	startMonitoring() {
		// FPS tracking
		const measureFPS = () => {
			const now = performance.now();
			const delta = now - this.lastFrameTime;
			const fps = 1000 / delta;

			this.fpsHistory.push(fps);
			if (this.fpsHistory.length > 60) {
				this.fpsHistory.shift();
			}

			this.lastFrameTime = now;

			// Если FPS < 30, логируем
			if (fps < 30) {
				console.warn(`Low FPS: ${fps.toFixed(1)}`);
				metrics.increment("performance.low_fps");
			}

			requestAnimationFrame(measureFPS);
		};

		requestAnimationFrame(measureFPS);

		// Long tasks observer
		if ("PerformanceObserver" in window) {
			const observer = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.duration > 50) {
						// > 50ms
						console.warn(`Long task detected: ${entry.duration}ms`);
						metrics.timing("performance.long_task", entry.duration);
					}
				}
			});

			observer.observe({ entryTypes: ["longtask"] });
		}
	}

	getAverageFPS() {
		if (this.fpsHistory.length === 0) return 0;
		const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
		return sum / this.fpsHistory.length;
	}
}

export const performanceMonitor = new PerformanceMonitor();
```

---

## 🚀 Startup Strategies

### 1. Startup Types

```javascript
const StartupType = {
	COLD: "cold", // первый запуск / очищенное хранилище
	WARM: "warm", // возврат из фона / refresh
	REHYDRATE: "rehydrate", // восстановление сессии
	OFFLINE: "offline", // нет сети при старте
};
```

### 2. DetectionMachine (новое, часть boot)

**Файл:** `src/machines/boot/detection.machine.js`

```javascript
DetectionMachine
├─ detecting
│  ├─ checkingStorage
│  ├─ checkingNetwork
│  └─ checkingPerformance (device capabilities)
├─ determined
│  ├─ cold → ColdStartStrategy
│  ├─ warm → WarmStartStrategy
│  ├─ rehydrate → RehydrateStrategy
│  └─ offline → OfflineStartStrategy
└─ error
```

**Контекст:**

```javascript
{
  hasStoredSession: false,
  hasNetwork: false,
  deviceCapabilities: {
    hasWebWorkers: true,
    hasCrypto: true,
    hasIndexedDB: true,
    memoryLimit: 2048, // MB
    isMobile: false
  },
  startupType: null,
  startTime: 0
}
```

**Логика определения:**

```javascript
function determineStartupType(context) {
	const { hasStoredSession, hasNetwork } = context;

	// Проверяем, был ли недавний refresh
	const lastActivity = localStorage.getItem("lastActivity");
	const now = Date.now();
	const wasRecentlyActive = lastActivity && now - lastActivity < 60000; // < 1 минуты

	if (!hasStoredSession) {
		return StartupType.COLD;
	}

	if (!hasNetwork) {
		return StartupType.OFFLINE;
	}

	if (wasRecentlyActive) {
		return StartupType.WARM;
	}

	return StartupType.REHYDRATE;
}
```

### 3. Startup Strategies

#### COLD Start

```javascript
const ColdStartStrategy = {
	async execute(context) {
		// 1. Минимальная инициализация
		await initCrypto();
		await initStorage();

		// 2. UI сразу
		renderAuthScreen();

		// 3. Фоновая загрузка
		Promise.all([preloadAssets(), warmupWorkers(), checkForUpdates()]);

		metrics.timing("startup.cold", performance.now() - context.startTime);
	},
};
```

#### WARM Start

```javascript
const WarmStartStrategy = {
	async execute(context) {
		// 1. Быстрая проверка сессии
		const session = await quickSessionCheck();

		if (!session) {
			return ColdStartStrategy.execute(context);
		}

		// 2. UI shell сразу
		renderAppShell();

		// 3. Параллельная загрузка
		const [profile, contacts, recentMessages] = await Promise.all([
			loadProfile(),
			loadContacts({ limit: 20 }), // только видимые
			loadRecentMessages({ limit: 10 }),
		]);

		// 4. Ленивая загрузка остального
		setTimeout(() => {
			loadFullContacts();
			loadAllMessages();
			connectSignaling();
		}, 100);

		metrics.timing("startup.warm", performance.now() - context.startTime);
	},
};
```

#### REHYDRATE Start

```javascript
const RehydrateStrategy = {
	async execute(context) {
		// 1. Проверяем целостность сессии
		const session = await validateSession();

		if (!session.valid) {
			console.warn("Session invalid, forcing logout");
			await clearStorage();
			return ColdStartStrategy.execute(context);
		}

		// 2. Восстанавливаем криптографию
		await restoreCryptoKeys(session.keys);

		// 3. UI shell
		renderAppShell();

		// 4. Синхронизация
		const missedEvents = await syncMissedEvents(session.lastSyncTimestamp);

		// 5. Применяем изменения
		await applyMissedEvents(missedEvents);

		// 6. Обычный старт
		await connectSignaling();

		metrics.timing("startup.rehydrate", performance.now() - context.startTime);
	},
};
```

#### OFFLINE Start

```javascript
const OfflineStartStrategy = {
	async execute(context) {
		// 1. Проверяем кэш
		const session = await loadCachedSession();

		if (!session) {
			showOfflineWarning();
			return ColdStartStrategy.execute(context);
		}

		// 2. Read-only режим
		renderAppShell({ readonly: true });

		// 3. Загружаем только локальные данные
		const [profile, contacts, messages] = await Promise.all([
			loadProfileFromCache(),
			loadContactsFromCache(),
			loadMessagesFromCache(),
		]);

		// 4. Слушаем восстановление сети
		window.addEventListener("online", () => {
			eventBus.dispatch({ type: "NETWORK_ONLINE" }, "HIGH");
		});

		showOfflineIndicator();

		metrics.timing("startup.offline", performance.now() - context.startTime);
	},
};
```

### 4. Performance Budget

**Целевые значения:**

| Startup Type | TTI (Time to Interactive) | FCP (First Contentful Paint) | LCP (Largest Contentful Paint) |
| ------------ | ------------------------- | ---------------------------- | ------------------------------ |
| COLD         | < 3s                      | < 1s                         | < 2s                           |
| WARM         | < 1s                      | < 500ms                      | < 1s                           |
| REHYDRATE    | < 2s                      | < 800ms                      | < 1.5s                         |
| OFFLINE      | < 1.5s                    | < 600ms                      | < 1.2s                         |

**Измерение:**

```javascript
// src/runtime/performance-budget.js

class PerformanceBudget {
	constructor() {
		this.budgets = {
			cold: { tti: 3000, fcp: 1000, lcp: 2000 },
			warm: { tti: 1000, fcp: 500, lcp: 1000 },
			rehydrate: { tti: 2000, fcp: 800, lcp: 1500 },
			offline: { tti: 1500, fcp: 600, lcp: 1200 },
		};

		this.observe();
	}

	observe() {
		if ("PerformanceObserver" in window) {
			// FCP
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.name === "first-contentful-paint") {
						this.check("fcp", entry.startTime);
					}
				}
			}).observe({ entryTypes: ["paint"] });

			// LCP
			new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				this.check("lcp", lastEntry.renderTime || lastEntry.loadTime);
			}).observe({ entryTypes: ["largest-contentful-paint"] });
		}
	}

	check(metric, value) {
		const startupType = this.getStartupType();
		const budget = this.budgets[startupType];

		if (value > budget[metric]) {
			console.warn(
				`Performance budget exceeded: ${metric} = ${value}ms (budget: ${budget[metric]}ms)`
			);

			metrics.increment("performance.budget_exceeded", 1, {
				metric,
				startupType,
			});
		}

		metrics.timing(`performance.${metric}`, value, { startupType });
	}

	getStartupType() {
		// Получаем из AppMachine context
		return "warm"; // placeholder
	}
}

export const performanceBudget = new PerformanceBudget();
```

---

## 🛠️ Services (обновлённые)

### 1. CryptoService (с Worker)

**Файл:** `src/services/crypto.service.js`

```javascript
class CryptoService {
	constructor() {
		this.worker = null;
		this.pendingRequests = new Map();
		this.requestId = 0;
	}

	async init() {
		// Создаём Worker
		this.worker = new Worker("/workers/crypto.worker.js");

		this.worker.onmessage = (e) => {
			const { requestId, result, error } = e.data;
			const pending = this.pendingRequests.get(requestId);

			if (!pending) return;

			if (error) {
				pending.reject(new Error(error));
			} else {
				pending.resolve(result);
			}

			this.pendingRequests.delete(requestId);
		};

		this.worker.onerror = (err) => {
			console.error("CryptoWorker crashed:", err);

			eventBus.dispatch(
				{
					type: "ERROR_OCCURRED",
					error: new Error("CryptoWorker crashed"),
					source: "CryptoService",
					severity: "CRITICAL",
					recoverable: true,
				},
				"HIGH"
			);

			// Пытаемся перезапустить
			this.restart();
		};
	}

	async restart() {
		if (this.worker) {
			this.worker.terminate();
		}

		// Отклоняем pending requests
		for (const [id, { reject }] of this.pendingRequests) {
			reject(new Error("Worker restarted"));
		}
		this.pendingRequests.clear();

		await this.init();
	}

	async request(method, params) {
		if (!this.worker) {
			await this.init();
		}

		const requestId = this.requestId++;

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(requestId, { resolve, reject });

			this.worker.postMessage({
				requestId,
				method,
				params,
			});

			// Timeout 30s
			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					this.pendingRequests.delete(requestId);
					reject(new Error("Crypto operation timeout"));
				}
			}, 30000);
		});
	}

	// Public API
	async generateKeyPair() {
		return this.request("generateKeyPair", {});
	}

	async encrypt(plaintext, recipientPublicKey) {
		return this.request("encrypt", { plaintext, recipientPublicKey });
	}

	async decrypt(ciphertext, senderPublicKey) {
		return this.request("decrypt", { ciphertext, senderPublicKey });
	}

	// Fallback на main thread (если worker недоступен)
	async encryptFallback(plaintext, recipientPublicKey) {
		// Реализация AES-GCM на main thread
		// ...
	}
}

export const cryptoService = new CryptoService();
```

**Worker:** `public/workers/crypto.worker.js`

```javascript
// crypto.worker.js

self.onmessage = async (e) => {
	const { requestId, method, params } = e.data;

	try {
		let result;

		switch (method) {
			case "generateKeyPair":
				result = await generateKeyPair();
				break;

			case "encrypt":
				result = await encrypt(params.plaintext, params.recipientPublicKey);
				break;

			case "decrypt":
				result = await decrypt(params.ciphertext, params.senderPublicKey);
				break;

			default:
				throw new Error(`Unknown method: ${method}`);
		}

		self.postMessage({ requestId, result });
	} catch (error) {
		self.postMessage({
			requestId,
			error: error.message,
		});
	}
};

async function generateKeyPair() {
	// Ed25519 key generation
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["sign", "verify"]
	);

	const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
	const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

	// Генерируем userId из publicKey
	const publicKeyStr = JSON.stringify(publicKey);
	const hashBuffer = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(publicKeyStr)
	);
	const userId = btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(
		0,
		16
	);

	return {
		publicKey: JSON.stringify(publicKey),
		privateKey: JSON.stringify(privateKey),
		userId,
	};
}

async function encrypt(plaintext, recipientPublicKeyStr) {
	// ECDH для получения shared secret
	// затем AES-GCM для шифрования

	const recipientPublicKey = await crypto.subtle.importKey(
		"jwk",
		JSON.parse(recipientPublicKeyStr),
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		[]
	);

	// Генерируем ephemeral ключ
	const ephemeralKeyPair = await crypto.subtle.generateKey(
		{ name: "ECDH", namedCurve: "P-256" },
		true,
		["deriveKey"]
	);

	// Получаем shared secret
	const sharedSecret = await crypto.subtle.deriveKey(
		{ name: "ECDH", public: recipientPublicKey },
		ephemeralKeyPair.privateKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt"]
	);

	// Шифруем
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedText = new TextEncoder().encode(plaintext);

	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		sharedSecret,
		encodedText
	);

	// Экспортируем ephemeral публичный ключ
	const ephemeralPublicKey = await crypto.subtle.exportKey(
		"jwk",
		ephemeralKeyPair.publicKey
	);

	return {
		ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
		iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
		ephemeralPublicKey: JSON.stringify(ephemeralPublicKey),
	};
}

async function decrypt(ciphertextStr, senderPublicKeyStr) {
	// Обратный процесс
	// ...

	return plaintext;
}
```

### 2. StorageService (с батчингом)

Уже описан выше в разделе "Performance & Backpressure"

### 3. SignalingService

**Файл:** `src/services/signaling.service.js`

```javascript
class SignalingService {
	constructor() {
		this.baseURL = "https://functions.yandexcloud.net/your-function-id";
		this.userId = null;
		this.publicKey = null;
		this.pollInterval = null;
		this.abortController = null;
	}

	async connect(userId, publicKey) {
		this.userId = userId;
		this.publicKey = publicKey;

		// Регистрируемся на сервере
		const response = await fetch(`${this.baseURL}/connect`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, publicKey }),
		});

		if (!response.ok) {
			throw new Error("Connection failed");
		}

		// Запускаем long polling
		this.startPolling();
	}

	startPolling() {
		this.abortController = new AbortController();

		const poll = async () => {
			try {
				const response = await fetch(`${this.baseURL}/poll`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: this.userId }),
					signal: this.abortController.signal,
				});

				if (!response.ok) {
					throw new Error("Poll failed");
				}

				const events = await response.json();

				// Отправляем события в EventBus
				for (const event of events) {
					this.handleServerEvent(event);
				}
			} catch (err) {
				if (err.name === "AbortError") return;

				console.error("Polling error:", err);

				eventBus.dispatch(
					{
						type: "CONNECTION_LOST",
					},
					"HIGH"
				);
			}

			// Следующий poll
			if (!this.abortController.signal.aborted) {
				setTimeout(poll, 1000); // 1 секунда между polls
			}
		};

		poll();
	}

	stopPolling() {
		if (this.abortController) {
			this.abortController.abort();
		}
	}

	handleServerEvent(event) {
		switch (event.type) {
			case "message":
				eventBus.dispatch(
					{
						type: "MESSAGE_RECEIVED",
						from: event.from,
						payload: event.payload,
					},
					"HIGH"
				);
				break;

			case "contact_request":
				eventBus.dispatch(
					{
						type: "INVITE_RECEIVED",
						from: event.from,
						fromName: event.fromName,
						publicKey: event.publicKey,
					},
					"MEDIUM"
				);
				break;

			case "typing":
				rateLimiters.typing(event.from);
				break;

			case "presence":
				rateLimiters.presence(event.from, event.status);
				break;

			// ... другие типы
		}
	}

	async sendMessage(to, payload) {
		const response = await fetch(`${this.baseURL}/send`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				from: this.userId,
				to,
				payload,
			}),
		});

		if (!response.ok) {
			throw new Error("Send failed");
		}

		return response.json();
	}

	async sendInvite(to, myName) {
		const response = await fetch(`${this.baseURL}/invite`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				from: this.userId,
				fromName: myName,
				to,
				publicKey: this.publicKey,
			}),
		});

		if (!response.ok) {
			throw new Error("Invite failed");
		}
	}

	disconnect() {
		this.stopPolling();

		fetch(`${this.baseURL}/disconnect`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: this.userId }),
		}).catch(() => {}); // ignore errors on disconnect
	}
}

export const signalingService = new SignalingService();
```

### 4. MediaService (с Worker)

**Файл:** `src/services/media.service.js`

```javascript
class MediaService {
	async compressImage(file, maxWidth = 1024, quality = 0.8) {
		return new Promise((resolve, reject) => {
			const worker = new Worker("/workers/media.worker.js");

			const reader = new FileReader();
			reader.onload = (e) => {
				worker.postMessage({
					method: "compressImage",
					params: {
						imageData: e.target.result,
						maxWidth,
						quality,
					},
				});
			};

			worker.onmessage = (e) => {
				const { result, error } = e.data;

				worker.terminate();

				if (error) {
					reject(new Error(error));
				} else {
					resolve(result);
				}
			};

			reader.readAsDataURL(file);
		});
	}

	async generateThumbnail(file, width = 200, height = 200) {
		// Similar to compressImage
	}

	async recordVoice() {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const mediaRecorder = new MediaRecorder(stream);

		const chunks = [];

		mediaRecorder.ondataavailable = (e) => {
			chunks.push(e.data);
		};

		return {
			start: () => mediaRecorder.start(),
			stop: () =>
				new Promise((resolve) => {
					mediaRecorder.onstop = async () => {
						const blob = new Blob(chunks, { type: "audio/webm" });
						const base64 = await this.blobToBase64(blob);
						resolve(base64);
					};
					mediaRecorder.stop();
					stream.getTracks().forEach((track) => track.stop());
				}),
		};
	}

	async blobToBase64(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}
}

export const mediaService = new MediaService();
```

---

## 🎨 UI Components (Lit)

### Принципы

1. **Компоненты НЕ знают о машинах** напрямую
2. Получают `actor` или `state` через props
3. Отправляют события через callbacks или напрямую актору
4. Используют mcss для стилей
5. Реактивны через `@property` и `subscribe`

### Пример компонента

**Файл:** `src/components/chat/chat-window.js`

```javascript
import { LitElement, html, css } from "lit";
import { classMap } from "lit/directives/class-map.js";

export class ChatWindow extends LitElement {
	static properties = {
		conversationActor: { type: Object },
		state: { type: Object },
	};

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
		}

		.messages {
			flex: 1;
			overflow-y: auto;
			padding: 1rem;
		}

		.message {
			margin-bottom: 0.5rem;
			padding: 0.5rem 1rem;
			border-radius: 1rem;
			max-width: 70%;
		}

		.message.own {
			background: var(--color-primary);
			color: white;
			margin-left: auto;
		}

		.message.other {
			background: var(--color-surface);
			margin-right: auto;
		}

		.composer {
			display: flex;
			gap: 0.5rem;
			padding: 1rem;
			border-top: 1px solid var(--color-border);
		}

		input {
			flex: 1;
			padding: 0.5rem 1rem;
			border: 1px solid var(--color-border);
			border-radius: 1rem;
			outline: none;
		}

		button {
			padding: 0.5rem 1rem;
			background: var(--color-primary);
			color: white;
			border: none;
			border-radius: 1rem;
			cursor: pointer;
		}
	`;

	constructor() {
		super();
		this.state = null;
		this.unsubscribe = null;
	}

	connectedCallback() {
		super.connectedCallback();

		// Подписываемся на изменения актора
		if (this.conversationActor) {
			this.unsubscribe = this.conversationActor.subscribe((snapshot) => {
				this.state = snapshot;
				this.requestUpdate();
			});
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();

		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	handleSendMessage(e) {
		e.preventDefault();

		const input = this.shadowRoot.querySelector("input");
		const text = input.value.trim();

		if (!text) return;

		// Отправляем событие актору
		this.conversationActor.send({
			type: "SEND_MESSAGE",
			text,
		});

		input.value = "";
	}

	render() {
		if (!this.state) {
			return html`<div>Loading...</div>`;
		}

		const { messages, isTyping, peerIsTyping } = this.state.context;

		return html`
			<div class="messages">
				${messages.map(
					(msg) => html`
						<div
							class=${classMap({
								message: true,
								own: msg.fromMe,
								other: !msg.fromMe,
							})}
						>
							${msg.text}
						</div>
					`
				)} ${peerIsTyping
					? html` <div class="typing-indicator">Typing...</div> `
					: ""}
			</div>

			<form class="composer" @submit=${this.handleSendMessage}>
				<input
					type="text"
					placeholder="Type a message..."
					@input=${() => {
						this.conversationActor.send({ type: "START_TYPING" });
					}}
				/>
				<button type="submit">Send</button>
			</form>
		`;
	}
}

customElements.define("chat-window", ChatWindow);
```

---

## 📦 Deployment

### 1. Build Process

**`vite.config.js`:**

```javascript
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	plugins: [
		viteSingleFile({
			removeViteModuleLoader: true,
		}),
	],
	build: {
		target: "esnext",
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true, // удаляем console.log в production
				drop_debugger: true,
			},
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
	},
});
```

**Build command:**

```bash
npm run build
# → dist/index.html (~80-100KB)
```

### 2. Production Checklist

- ✅ Service Worker для offline работы
- ✅ manifest.json для PWA
- ✅ CSP headers
- ✅ Error tracking (Sentry или custom)
- ✅ Analytics (опционально)
- ✅ Performance monitoring включён
- ✅ Console logs удалены
- ✅ Source maps опциональны

### 3. Service Worker

**`public/sw.js`:**

```javascript
const CACHE_NAME = "chat-v0.3.0";
const urlsToCache = ["/", "/index.html"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
	);
});

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches
			.match(event.request)
			.then((response) => response || fetch(event.request))
	);
});
```

**Регистрация:**

```javascript
// В index.html
if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/sw.js")
		.then(() => console.log("Service Worker registered"))
		.catch((err) => console.error("SW registration failed:", err));
}
```

---

## 📚 Итоговая структура файлов

```
chat-app/
├─ public/
│  ├─ index.html (entry point)
│  ├─ sw.js
│  ├─ manifest.json
│  └─ workers/
│     ├─ crypto.worker.js
│     └─ media.worker.js
│
├─ src/
│  ├─ machines/
│  │  ├─ app.machine.js
│  │  ├─ auth.machine.js
│  │  ├─ identity.machine.js
│  │  ├─ contacts.machine.js
│  │  ├─ signaling.machine.js
│  │  ├─ sync.machine.js
│  │  ├─ crypto.machine.js
│  │  ├─ chat.machine.js
│  │  ├─ groups.machine.js
│  │  ├─ streams.machine.js
│  │  ├─ modal.machine.js
│  │  ├─ notification.machine.js
│  │  ├─ persistence.machine.js
│  │  ├─ shell.machine.js
│  │  ├─ lifecycle.machine.js        ← новое
│  │  ├─ error-boundary.machine.js   ← новое
│  │  └─ instrumentation.machine.js  ← новое
│  │
│  ├─ services/
│  │  ├─ crypto.service.js
│  │  ├─ storage.service.js
│  │  ├─ signaling.service.js
│  │  └─ media.service.js
│  │
│  ├─ runtime/                        ← новое
│  │  ├─ event-bus.js
│  │  ├─ actor-registry.js
│  │  ├─ logger.js
│  │  ├─ metrics.js
│  │  ├─ performance-monitor.js
│  │  ├─ memory-manager.js
│  │  ├─ rate-limiters.js
│  │  └─ performance-budget.js
│  │
│  ├─ components/
│  │  ├─ app-shell.js
│  │  ├─ auth/
│  │  ├─ shell/
│  │  ├─ contacts/
│  │  ├─ chat/
│  │  ├─ groups/
│  │  ├─ streams/
│  │  ├─ modals/
│  │  └─ profile/
│  │
│  ├─ styles/
│  │  └─ mcss.css
│  │
│  └─ main.js (bootstrap)
│
├─ package.json
├─ vite.config.js
└─ README.md
```

---

## 🎯 Финальные принципы (TL;DR)

### 1. Разделение ответственности

- **XState** = поведение и бизнес-логика
- **Services** = доменная логика
- **Workers** = тяжёлые вычисления
- **UI** = презентация

### 2. Lifecycle Management

- Каждый актор имеет явный жизненный цикл
- ActorRegistry для централизованного управления
- Автоматический cleanup при уничтожении

### 3. Error Handling

- Таксономия ошибок (Local / Domain / System)
- Стратегии восстановления
- ErrorBoundaryMachine для изоляции

### 4. Performance

- Thread Budget (main thread < 16ms)
- Event Priority Queue с backpressure
- Batching для IndexedDB и network
- Memory Manager для предотвращения утечек

### 5. Observability

- Transition logging
- Metrics collection (counters, timers, gauges)
- Performance monitoring (FPS, long tasks)
- Performance budget enforcement

### 6. Startup Optimization

- 4 типа старта (COLD / WARM / REHYDRATE / OFFLINE)
- Ленивая загрузка
- Performance budgets

### 7. Extensibility

- Модульная архитектура
- Легко добавить новую машину
- Services легко заменяемы
- UI компоненты изолированы

---

## ✅ Готовность к production

Эта архитектура обеспечивает:

1. ✅ **Надёжность** - error recovery, cleanup, isolation
2. ✅ **Производительность** - worker offloading, batching, budgets
3. ✅ **Наблюдаемость** - logging, metrics, tracing
4. ✅ **Масштабируемость** - actor model, registry, lifecycle
5. ✅ **Поддерживаемость** - чёткие границы, тестируемость
6. ✅ **Расширяемость** - модульная структура

# 🔧 Обновление: Custom Signaling URL

**Добавлено в архитектуру v0.3.0**

---

## 🎯 Функционал

Пользователь может:

1. Использовать дефолтный сигнальный сервер (наш)
2. Указать свой URL к Yandex Cloud Function
3. Сохранить настройку локально (IndexedDB)
4. Переключаться между серверами

---

## 📋 Изменения в архитектуре

### 1. Расширение SettingsMachine (новое)

**Файл:** `src/machines/settings.machine.js`

```javascript
SettingsMachine
├─ idle
├─ editing
│  ├─ general
│  ├─ signaling        ← новое
│  ├─ appearance
│  └─ privacy
└─ saving
    └─ invoke: storageService.saveSettings
```

**Контекст:**

```javascript
{
  settings: {
    // Новое: Signaling settings
    signaling: {
      url: null,              // string | null (если null → используем дефолтный)
      mode: 'default',        // 'default' | 'custom'
      testStatus: null,       // 'pending' | 'success' | 'failed' | null
      lastTested: null        // timestamp | null
    },

    // Существующие настройки
    appearance: {
      theme: 'auto',          // 'light' | 'dark' | 'auto'
      language: 'en'
    },
    privacy: {
      readReceipts: true,
      typingIndicators: true,
      lastSeen: true
    },
    notifications: {
      enabled: true,
      sound: true,
      desktop: true
    }
  }
}
```

**События:**

```javascript
// SET_SIGNALING_URL
{
  type: 'SET_SIGNALING_URL',
  url: 'https://functions.yandexcloud.net/my-custom-id'
}

// TEST_SIGNALING_URL
{
  type: 'TEST_SIGNALING_URL',
  url: 'https://functions.yandexcloud.net/my-custom-id'
}

// RESET_SIGNALING_URL
{
  type: 'RESET_SIGNALING_URL'
}

// SIGNALING_TEST_RESULT
{
  type: 'SIGNALING_TEST_RESULT',
  success: true,
  latency: 125 // ms
}
```

---

### 2. Обновление SignalingService

**Файл:** `src/services/signaling.service.js`

```javascript
class SignalingService {
	constructor() {
		this.defaultURL = "https://functions.yandexcloud.net/d4e5xxxxxxxxxxxxxxxx"; // наш дефолтный
		this.baseURL = this.defaultURL;
		this.userId = null;
		this.publicKey = null;
		this.pollInterval = null;
		this.abortController = null;
	}

	// Новое: установка кастомного URL
	setCustomURL(url) {
		if (!url) {
			this.baseURL = this.defaultURL;
			return;
		}

		// Валидация URL
		try {
			const parsed = new URL(url);
			if (!parsed.protocol.startsWith("http")) {
				throw new Error("Invalid protocol");
			}
			this.baseURL = url.replace(/\/$/, ""); // убираем trailing slash
		} catch (err) {
			throw new Error("Invalid URL format");
		}
	}

	// Новое: тест соединения
	async testConnection(url = null) {
		const testURL = url || this.baseURL;
		const startTime = performance.now();

		try {
			const response = await fetch(`${testURL}/health`, {
				method: "GET",
				signal: AbortSignal.timeout(5000), // 5 секунд timeout
			});

			if (!response.ok) {
				throw new Error(`Server returned ${response.status}`);
			}

			const data = await response.json();

			// Проверяем, что это наш сервер
			if (!data.service || data.service !== "chat-signaling") {
				throw new Error("Invalid signaling server");
			}

			const latency = Math.round(performance.now() - startTime);

			return {
				success: true,
				latency,
				version: data.version || "unknown",
			};
		} catch (err) {
			return {
				success: false,
				error: err.message,
				latency: null,
			};
		}
	}

	// Новое: получить текущий URL
	getCurrentURL() {
		return this.baseURL;
	}

	// Новое: проверка, используется ли дефолтный сервер
	isUsingDefaultServer() {
		return this.baseURL === this.defaultURL;
	}

	// Существующие методы без изменений
	async connect(userId, publicKey) {
		this.userId = userId;
		this.publicKey = publicKey;

		const response = await fetch(`${this.baseURL}/connect`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, publicKey }),
		});

		if (!response.ok) {
			throw new Error("Connection failed");
		}

		this.startPolling();
	}

	// ... остальные методы без изменений
}

export const signalingService = new SignalingService();
```

---

### 3. Обновление AppMachine (boot последовательность)

**Файл:** `src/machines/app.machine.js`

```javascript
AppMachine
├─ boot
│  ├─ detecting (cold/warm/offline)
│  ├─ loadingSettings        ← новое
│  │  └─ invoke: loadSettings
│  │     ├─ onDone → applyingSettings
│  │     └─ onError → usingDefaults
│  ├─ applyingSettings       ← новое
│  │  └─ configureSignaling()
│  └─ restoring
└─ authenticated (parallel)
    ├─ settings              ← новое
    ├─ shell
    ├─ auth
    // ... остальные
```

**Actions:**

```javascript
actions: {
	configureSignaling: (context) => {
		const { settings } = context;

		if (settings?.signaling?.url) {
			try {
				signalingService.setCustomURL(settings.signaling.url);
				console.log(
					"✅ Using custom signaling server:",
					settings.signaling.url
				);
			} catch (err) {
				console.error("❌ Invalid signaling URL, using default:", err);
				signalingService.setCustomURL(null);
			}
		} else {
			console.log("✅ Using default signaling server");
			signalingService.setCustomURL(null);
		}
	};
}
```

---

### 4. UI компонент: Signaling Settings

**Файл:** `src/components/settings/signaling-settings.js`

```javascript
import { LitElement, html, css } from "lit";

export class SignalingSettings extends LitElement {
	static properties = {
		settingsActor: { type: Object },
		state: { type: Object },
		testing: { type: Boolean },
	};

	static styles = css``;

	constructor() {
		super();
		this.testing = false;
	}

	connectedCallback() {
		super.connectedCallback();

		if (this.settingsActor) {
			this.unsubscribe = this.settingsActor.subscribe((snapshot) => {
				this.state = snapshot;
				this.requestUpdate();
			});
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	handleModeChange(mode) {
		this.settingsActor.send({
			type: "UPDATE_SETTING",
			path: "signaling.mode",
			value: mode,
		});
	}

	handleURLChange(e) {
		const url = e.target.value.trim();
		this.settingsActor.send({
			type: "SET_SIGNALING_URL",
			url,
		});
	}

	async handleTest() {
		const url = this.state.context.settings.signaling.url;

		if (!url) return;

		this.testing = true;

		this.settingsActor.send({
			type: "TEST_SIGNALING_URL",
			url,
		});
	}

	handleReset() {
		this.settingsActor.send({
			type: "RESET_SIGNALING_URL",
		});
	}

	render() {
		if (!this.state) {
			return html`<div>Loading...</div>`;
		}

		const { signaling } = this.state.context.settings;
		const mode = signaling.mode || "default";
		const customURL = signaling.url || "";
		const testStatus = signaling.testStatus;
		const isCustomMode = mode === "custom";

		return html`
			<div class="section">
				<div class="section-title">Signaling Server</div>

				<div class="radio-group">
					<div
						class="radio-option ${mode === "default" ? "selected" : ""}"
						@click=${() => this.handleModeChange("default")}
					>
						<input
							type="radio"
							name="mode"
							value="default"
							.checked=${mode === "default"}
						/>
						<div class="radio-label">
							<div class="radio-title">Default Server</div>
							<div class="radio-description">
								Use our public signaling server (recommended)
							</div>
						</div>
					</div>

					<div
						class="radio-option ${mode === "custom" ? "selected" : ""}"
						@click=${() => this.handleModeChange("custom")}
					>
						<input
							type="radio"
							name="mode"
							value="custom"
							.checked=${mode === "custom"}
						/>
						<div class="radio-label">
							<div class="radio-title">Custom Server</div>
							<div class="radio-description">
								Use your own Yandex Cloud Function
							</div>
						</div>
					</div>
				</div>

				${isCustomMode
					? html`
							<div class="input-group">
								<label>Signaling Function URL</label>
								<input
									type="text"
									placeholder="https://functions.yandexcloud.net/your-id"
									.value=${customURL}
									@input=${this.handleURLChange}
								/>
							</div>

							<div class="actions">
								<button
									class="primary"
									@click=${this.handleTest}
									.disabled=${!customURL || this.testing}
								>
									${this.testing
										? html`
												<span class="spinner"></span>
												Testing...
										  `
										: "Test Connection"}
								</button>

								<button
									class="secondary"
									@click=${this.handleReset}
									.disabled=${!customURL}
								>
									Reset
								</button>
							</div>

							${testStatus
								? html`
										<div
											class="test-result ${testStatus === "success"
												? "success"
												: "error"}"
										>
											${testStatus === "success"
												? html`
														✅ Connection successful! Latency: ${signaling.latency}ms
												  `
												: html` ❌ Connection failed. Please check your URL. `}
										</div>
								  `
								: ""}
					  `
					: ""}
			</div>
		`;
	}
}

customElements.define("signaling-settings", SignalingSettings);
```

---

### 5. Обновление структуры Settings в Storage

**Файл:** `src/services/storage.service.js`

```javascript
// Добавляем миграцию для существующих пользователей

async function migrateSettings(db) {
	const tx = db.transaction(["settings"], "readwrite");
	const store = tx.objectStore("settings");

	const settings = await store.get("user-settings");

	if (settings && !settings.signaling) {
		settings.signaling = {
			url: null,
			mode: "default",
			testStatus: null,
			lastTested: null,
		};

		await store.put(settings);
	}
}
```

---

### 6. Yandex Cloud Function API Requirements

**Минимальные эндпоинты, которые должен поддерживать кастомный сервер:**

```javascript
// GET /health - проверка доступности
{
  "service": "chat-signaling",
  "version": "1.0.0",
  "status": "ok"
}

// POST /connect - регистрация пользователя
// Body: { userId, publicKey }
// Response: { success: true }

// POST /poll - long polling
// Body: { userId }
// Response: { events: [...] }

// POST /send - отправка сообщения
// Body: { from, to, payload }
// Response: { success: true, messageId }

// POST /invite - отправка приглашения
// Body: { from, fromName, to, publicKey }
// Response: { success: true }

// POST /disconnect - отключение
// Body: { userId }
// Response: { success: true }
```

---

### 7. Документация для пользователей

**Добавляем в UI (Settings → Help):**

```markdown
## Using Custom Signaling Server

You can deploy your own signaling server on Yandex Cloud Functions.

### Requirements:

1. Yandex Cloud account
2. Cloud Functions enabled
3. Our open-source function code (link to GitHub)

### Setup:

1. Clone the repository
2. Deploy to Yandex Cloud Functions
3. Copy your function URL
4. Paste it in Settings → Signaling Server → Custom Server

### Benefits:

- Full control over your infrastructure
- No dependency on our servers
- Custom logging and monitoring
- Compliance with your security policies

### API Compatibility:

Your function must implement these endpoints:

- GET /health
- POST /connect
- POST /poll
- POST /send
- POST /invite
- POST /disconnect

See documentation for details.
```

---

## 🎯 Итоговый workflow

### Первый запуск (дефолтный сервер)

```
1. User opens app
2. AppMachine → boot → loadingSettings
3. No custom URL found
4. signalingService uses defaultURL
5. Connect to our server ✅
```

### Переключение на кастомный сервер

```
1. User goes to Settings → Signaling Server
2. Selects "Custom Server"
3. Enters URL: https://functions.yandexcloud.net/custom-id
4. Clicks "Test Connection"
5. SettingsMachine → TEST_SIGNALING_URL
6. signalingService.testConnection(url)
   ├─ Success → Show ✅ with latency
   └─ Failed → Show ❌ with error
7. User clicks "Save"
8. Settings saved to IndexedDB
9. signalingService.setCustomURL(url)
10. SignalingMachine reconnects to new server
```

### Последующие запуски

```
1. AppMachine → boot → loadingSettings
2. Custom URL found in IndexedDB
3. signalingService.setCustomURL(url)
4. Connect to custom server ✅
```

---

## 📊 Дополнительные метрики

```javascript
// В InstrumentationMachine добавляем:
metrics.gauge(
	"signaling.server",
	signalingService.isUsingDefaultServer() ? "default" : "custom"
);
metrics.timing("signaling.latency", latency);
metrics.increment("signaling.test", 1, { result: "success" | "failed" });
```

---

## ✅ Обновлённый чеклист

- ✅ Дефолтный сигнальный сервер (наш)
- ✅ Возможность указать кастомный URL
- ✅ Тест соединения с кастомным сервером
- ✅ Валидация URL
- ✅ Сохранение настройки в IndexedDB
- ✅ Переключение между серверами без перезагрузки
- ✅ UI для управления настройками
- ✅ Документация для пользователей
- ✅ Метрики использования
