# 🏗️ Feature-Based Architecture Chat v1.0

**XState + Lit + mcss | Single-file HTML | Feature-Driven | Pure JavaScript**

---

## 📋 Оглавление

1. [Философия архитектуры](#философия-архитектуры)
2. [Структура проекта](#структура-проекта)
3. [Что такое фича](#что-такое-фича)
4. [Feature Contract](#feature-contract)
5. [Core Infrastructure](#core-infrastructure)
6. [Жизненный цикл приложения](#жизненный-цикл-приложения)
7. [Примеры фич](#примеры-фич)
8. [Коммуникация между фичами](#коммуникация-между-фичами)
9. [Добавление новой фичи](#добавление-новой-фичи)
10. [Best Practices](#best-practices)

---

## 🎯 Философия архитектуры

### Главный принцип

> **Фича = минимальная автономная причина изменения**

Не "маленький файл", не "компонент", а **вертикальный срез функциональности**.

### Что это даёт

**До (layered):**

```
Добавить "групповые чаты":
1. Создать groups.machine.js в machines/
2. Создать groups.service.js в services/
3. Создать UI компоненты в components/groups/
4. Обновить AppMachine
5. Обновить роутинг в shell
6. Добавить пункт меню
7. Зарегистрировать в нескольких местах

❌ Правки в 7+ местах
❌ Легко что-то забыть
❌ Сложно удалить фичу
```

**После (feature-based):**

```
Добавить "групповые чаты":
1. Создать features/groups/
2. Зарегистрировать в bootstrap:
   featureRegistry.register(groupsFeature)

✅ Правки в 1 месте
✅ Фича самодостаточна
✅ Легко включить/выключить
✅ Никто снаружи не знает, как она устроена
```

### Ключевые принципы

1. **Изоляция** - фича не знает о других фичах напрямую
2. **Автономность** - фича содержит всё необходимое
3. **Явная связь** - только через события, контракты, регистрацию
4. **Расширяемость** - новая фича не трогает старые

---

## 📂 Структура проекта

```
chat-app/
├── public/
│   ├── index.html                    ← entry point
│   ├── sw.js
│   ├── manifest.json
│   └── workers/
│       ├── crypto.worker.js
│       └── media.worker.js
│
├── src/
│   ├── features/                     ← 🎯 ВСЕ фичи здесь
│   │   ├── auth/
│   │   │   ├── index.js             ← экспорт фичи
│   │   │   ├── auth.machine.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.ui.js
│   │   │   └── auth.events.js
│   │   │
│   │   ├── identity/
│   │   │   ├── index.js
│   │   │   ├── identity.machine.js
│   │   │   ├── identity.service.js
│   │   │   └── identity.ui.js
│   │   │
│   │   ├── contacts/
│   │   ├── chat/
│   │   ├── groups/
│   │   ├── signaling/
│   │   ├── settings/
│   │   ├── crypto/
│   │   ├── persistence/
│   │   ├── notifications/
│   │   ├── shell/                    ← UI shell тоже фича!
│   │   └── streams/
│   │
│   ├── core/                         ← 🔧 Infrastructure
│   │   ├── event-bus.js             ← priority event bus
│   │   ├── feature-registry.js      ← регистрация фич
│   │   ├── lifecycle.js             ← lifecycle hooks
│   │   ├── error-boundary.js        ← error handling
│   │   ├── actor-registry.js        ← actor management
│   │   └── app-machine.js           ← root orchestrator
│   │
│   ├── runtime/                      ← 📊 Observability & Utils
│   │   ├── bootstrap.js             ← инициализация
│   │   ├── logger.js
│   │   ├── metrics.js
│   │   ├── performance-monitor.js
│   │   ├── memory-manager.js
│   │   ├── rate-limiters.js
│   │   └── performance-budget.js
│   │
│   ├── shared/                       ← 🛠️ Shared utilities (опционально)
│   │   ├── utils/
│   │   └── constants.js
│   │
│   └── main.js                       ← bootstrap entry
│
├── package.json
├── vite.config.js
└── README.md
```

### Правило изоляции

> **Ни один файл вне `features/X/` не знает, как X устроена**

Связь **ТОЛЬКО** через:

- События (EventBus)
- Контракты (Feature Contract)
- Регистрацию (FeatureRegistry)

---

## 🎨 Что такое фича

### Определение

**Фича** - это вертикальный срез функциональности, который:

1. **Содержит всё необходимое**: state machine, service, UI, события
2. **Автономен**: может работать независимо от других фич
3. **Изолирован**: не знает о других фичах напрямую
4. **Регистрируется**: через единую точку входа
5. **Коммуницирует**: только через события

### Анатомия фичи

```
features/auth/
├── index.js              ← Feature Contract (экспорт)
├── auth.machine.js       ← XState машина (логика)
├── auth.service.js       ← Бизнес-логика (опционально)
├── auth.ui.js            ← UI компоненты (опционально)
└── auth.events.js        ← События (контракт коммуникации)
```

**Не обязательно все файлы!** Минимум - `index.js` + что нужно фиче.

### Примеры фич

| Фича            | Описание              | Содержит                   |
| --------------- | --------------------- | -------------------------- |
| `auth`          | Аутентификация        | machine, UI (login/signup) |
| `identity`      | Управление профилем   | machine, service (keypair) |
| `contacts`      | Список контактов      | machine, service, UI       |
| `chat`          | Диалоги               | machine, service, UI       |
| `groups`        | Групповые чаты        | machine, service, UI       |
| `signaling`     | Подключение к серверу | machine, service           |
| `settings`      | Настройки             | machine, UI                |
| `crypto`        | Шифрование            | service, worker            |
| `persistence`   | Хранилище             | service (IndexedDB)        |
| `notifications` | Уведомления           | machine, UI                |
| `shell`         | UI оболочка           | UI, machine (routing)      |
| `streams`       | Видео/аудио           | machine, service, UI       |

---

## 📜 Feature Contract

### Базовый интерфейс

Каждая фича экспортирует объект с контрактом:

```javascript
// features/auth/index.js

export const authFeature = {
	// Метаданные
	id: "auth",
	name: "Authentication",
	version: "1.0.0",

	// Зависимости (опционально)
	dependencies: ["identity", "persistence"],

	// Lifecycle hooks
	async onRegister(context) {
		// Вызывается при регистрации
		console.log("Auth feature registered");
	},

	async onMount(context) {
		// Вызывается при старте приложения
		// context = { eventBus, actorRegistry, storage, ... }

		const actor = spawn(authMachine, {
			id: "auth",
			input: { storage: context.storage },
		});

		context.actorRegistry.register("auth", actor, {
			type: "feature",
			featureId: "auth",
		});

		return { actor };
	},

	async onUnmount(context) {
		// Вызывается при остановке
		context.actorRegistry.unregister("auth");
	},

	// События, которые фича слушает
	subscribedEvents: ["APP_READY", "LOGOUT", "SESSION_EXPIRED"],

	// События, которые фича отправляет
	emittedEvents: ["AUTH_SUCCESS", "AUTH_FAILED", "AUTH_LOGOUT"],

	// UI (опционально)
	ui: {
		components: {
			LoginForm: () => import("./auth.ui.js").then((m) => m.LoginForm),
			SignupForm: () => import("./auth.ui.js").then((m) => m.SignupForm),
		},

		routes: [
			{ path: "/login", component: "LoginForm" },
			{ path: "/signup", component: "SignupForm" },
		],
	},

	// Настройки (опционально)
	settings: {
		sessionTimeout: 3600000, // 1 hour
		rememberMe: true,
	},
};
```

### Минимальный контракт

Не все поля обязательны! Минимум:

```javascript
export const myFeature = {
	id: "my-feature",
	name: "My Feature",

	async onMount(context) {
		// делаем что нужно
	},
};
```

---

## 🔧 Core Infrastructure

### 1. FeatureRegistry

**Файл:** `core/feature-registry.js`

Центральный реестр фич. **Единственное** место, которое знает о всех фичах.

```javascript
class FeatureRegistry {
	constructor() {
		this.features = new Map(); // id -> feature
		this.mounted = new Map(); // id -> mountResult
		this.dependencies = new Map(); // id -> [deps]
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
		if (feature.onRegister) {
			feature.onRegister(this.getContext());
		}

		console.log(`✅ Feature registered: ${feature.id}`);
	}

	// Монтирование фич (с учётом зависимостей)
	async mountAll(context) {
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
		this.mounted.set(featureId, result);

		// Подписываемся на события
		if (feature.subscribedEvents) {
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

		if (feature.onUnmount) {
			await feature.onUnmount({ ...this.getContext(), ...mountResult });
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

	getContext() {
		// Контекст, доступный всем фичам
		return {
			eventBus,
			actorRegistry,
			storage,
			logger,
			metrics,
		};
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
```

### 2. EventBus (Priority Queue)

**Файл:** `core/event-bus.js`

Уже был в оригинальной архитектуре, остаётся без изменений:

```javascript
class PriorityEventBus extends EventTarget {
	constructor() {
		super();
		this.queues = {
			HIGH: [],
			MEDIUM: [],
			LOW: [],
			DROPPED: [],
		};
		this.processing = false;
		this.stats = { dropped: 0, processed: 0 };
	}

	dispatch(event, priority = "MEDIUM") {
		// Backpressure logic
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

	// ... остальная логика из оригинала

	// Удобный метод для подписки
	on(eventType, handler) {
		this.addEventListener(eventType, (e) => {
			handler(e.detail || e);
		});
	}
}

export const eventBus = new PriorityEventBus();
```

### 3. ActorRegistry

**Файл:** `core/actor-registry.js`

Из оригинала, без изменений. Управление lifecycle акторов.

### 4. AppMachine (Root Orchestrator)

**Файл:** `core/app-machine.js`

Корневая машина, но теперь **не знает о конкретных фичах**:

```javascript
import { setup, fromPromise } from 'xstate';

export const appMachine = setup({
  types: {
    context: {} as {
      features: string[],
      mountedFeatures: Set<string>,
      startupType: 'cold' | 'warm' | 'rehydrate' | 'offline'
    }
  },

  actors: {
    mountFeatures: fromPromise(async ({ input }) => {
      // Монтируем все зарегистрированные фичи
      await featureRegistry.mountAll(input.context);
      return { success: true };
    }),

    unmountFeatures: fromPromise(async () => {
      await featureRegistry.unmountAll();
      return { success: true };
    })
  }
}).createMachine({
  id: 'app',

  initial: 'booting',

  context: {
    features: [],
    mountedFeatures: new Set(),
    startupType: 'cold'
  },

  states: {
    booting: {
      initial: 'detecting',

      states: {
        detecting: {
          // Определяем тип старта
          invoke: {
            src: 'detectStartupType',
            onDone: {
              target: 'loadingSettings',
              actions: assign({
                startupType: ({ event }) => event.output
              })
            }
          }
        },

        loadingSettings: {
          invoke: {
            src: 'loadSettings',
            onDone: 'mounting'
          }
        },

        mounting: {
          invoke: {
            src: 'mountFeatures',
            input: ({ context }) => ({ context }),
            onDone: {
              target: '#app.ready',
              actions: assign({
                mountedFeatures: () => new Set(featureRegistry.getAll().map(f => f.id))
              })
            },
            onError: '#app.error'
          }
        }
      }
    },

    ready: {
      // Приложение работает
      on: {
        LOGOUT: 'shuttingDown',
        ERROR_CRITICAL: 'error'
      }
    },

    shuttingDown: {
      invoke: {
        src: 'unmountFeatures',
        onDone: 'terminated'
      }
    },

    error: {
      // Error boundary
    },

    terminated: {
      type: 'final'
    }
  }
});
```

---

## 🚀 Жизненный цикл приложения

### Bootstrap Process

**Файл:** `runtime/bootstrap.js`

```javascript
import { featureRegistry } from "../core/feature-registry.js";
import { eventBus } from "../core/event-bus.js";
import { actorRegistry } from "../core/actor-registry.js";
import { appMachine } from "../core/app-machine.js";
import { createActor } from "xstate";

// Импортируем все фичи
import { authFeature } from "../features/auth/index.js";
import { identityFeature } from "../features/identity/index.js";
import { contactsFeature } from "../features/contacts/index.js";
import { chatFeature } from "../features/chat/index.js";
import { groupsFeature } from "../features/groups/index.js";
import { signalingFeature } from "../features/signaling/index.js";
import { settingsFeature } from "../features/settings/index.js";
import { cryptoFeature } from "../features/crypto/index.js";
import { persistenceFeature } from "../features/persistence/index.js";
import { notificationsFeature } from "../features/notifications/index.js";
import { shellFeature } from "../features/shell/index.js";
import { streamsFeature } from "../features/streams/index.js";

export async function bootstrap() {
	console.log("🚀 Bootstrapping application...");

	// 1. Регистрируем фичи
	// ПОРЯДОК НЕ ВАЖЕН! FeatureRegistry сам разберётся с зависимостями
	featureRegistry.register(persistenceFeature); // базовая фича без зависимостей
	featureRegistry.register(cryptoFeature); // базовая фича
	featureRegistry.register(identityFeature); // depends: persistence, crypto
	featureRegistry.register(authFeature); // depends: identity
	featureRegistry.register(signalingFeature); // depends: identity
	featureRegistry.register(contactsFeature); // depends: persistence, signaling
	featureRegistry.register(chatFeature); // depends: contacts, crypto
	featureRegistry.register(groupsFeature); // depends: chat
	featureRegistry.register(streamsFeature); // depends: chat
	featureRegistry.register(settingsFeature); // depends: persistence
	featureRegistry.register(notificationsFeature); // depends: chat
	featureRegistry.register(shellFeature); // depends: auth (UI shell)

	// 2. Создаём root actor
	const appActor = createActor(appMachine, {
		input: {
			eventBus,
			actorRegistry,
			featureRegistry,
		},
	});

	appActor.start();

	// 3. Подписываемся на критические события
	appActor.subscribe((snapshot) => {
		console.log("App state:", snapshot.value);

		if (snapshot.matches("ready")) {
			// Отправляем глобальное событие
			eventBus.dispatch({ type: "APP_READY" }, "HIGH");
		}
	});

	// 4. Ждём готовности
	await waitFor(appActor, (state) => state.matches("ready"));

	console.log("✅ Application ready!");

	return { appActor };
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
```

### Lifecycle Diagram

```
┌─────────────────────────────────────┐
│         bootstrap()                 │
├─────────────────────────────────────┤
│  1. Register features               │
│     - featureRegistry.register()    │
│     - порядок не важен              │
│                                     │
│  2. Create AppMachine               │
│     - root orchestrator             │
│                                     │
│  3. AppMachine → booting            │
│     ├─ detecting (startup type)     │
│     ├─ loadingSettings              │
│     └─ mounting                     │
│        └─ featureRegistry.mountAll()│
│           ├─ resolve dependencies   │
│           ├─ topological sort       │
│           └─ mount in order         │
│                                     │
│  4. AppMachine → ready              │
│     - emit APP_READY                │
│     - фичи начинают работу          │
└─────────────────────────────────────┘

Feature Lifecycle:
┌────────────────────────────────────┐
│ featureRegistry.register(feature)  │ ← onRegister()
├────────────────────────────────────┤
│ featureRegistry.mount(feature)     │ ← onMount()
│  - spawn actors                    │
│  - subscribe to events             │
│  - setup UI                        │
├────────────────────────────────────┤
│ Feature is running                 │
│  - handle events                   │
│  - emit events                     │
│  - update state                    │
├────────────────────────────────────┤
│ featureRegistry.unmount(feature)   │ ← onUnmount()
│  - cleanup actors                  │
│  - unsubscribe events              │
│  - save critical state             │
└────────────────────────────────────┘
```

---

## 🎯 Примеры фич

### 1. Auth Feature

**Файл:** `features/auth/index.js`

```javascript
import { authMachine } from "./auth.machine.js";
import { spawn } from "xstate";

export const authFeature = {
	id: "auth",
	name: "Authentication",
	version: "1.0.0",

	dependencies: ["identity", "persistence"],

	async onMount(context) {
		const { eventBus, actorRegistry, storage } = context;

		// Spawn auth machine
		const actor = spawn(authMachine, {
			id: "auth",
			input: { storage },
		});

		// Регистрируем актор
		actorRegistry.register("auth", actor, {
			type: "feature",
			featureId: "auth",
		});

		// Подписываемся на события актора
		actor.subscribe((snapshot) => {
			if (snapshot.matches("authenticated")) {
				// Отправляем глобальное событие
				eventBus.dispatch(
					{
						type: "AUTH_SUCCESS",
						userId: snapshot.context.userId,
					},
					"HIGH"
				);
			}
		});

		return { actor };
	},

	async onUnmount(context) {
		context.actorRegistry.unregister("auth");
	},

	subscribedEvents: ["APP_READY", "LOGOUT", "SESSION_EXPIRED"],

	emittedEvents: ["AUTH_SUCCESS", "AUTH_FAILED", "AUTH_LOGOUT"],

	ui: {
		components: {
			LoginForm: () => import("./auth.ui.js").then((m) => m.LoginForm),
			SignupForm: () => import("./auth.ui.js").then((m) => m.SignupForm),
		},
	},
};
```

**Файл:** `features/auth/auth.machine.js`

```javascript
import { setup } from 'xstate';

export const authMachine = setup({
  types: {
    context: {} as {
      userId: string | null,
      sessionToken: string | null,
      error: string | null
    },
    events: {} as
      | { type: 'LOGIN', username: string, password: string }
      | { type: 'SIGNUP', username: string, password: string }
      | { type: 'LOGOUT' }
      | { type: 'SESSION_EXPIRED' }
  }
}).createMachine({
  id: 'auth',

  initial: 'checkingSession',

  context: {
    userId: null,
    sessionToken: null,
    error: null
  },

  states: {
    checkingSession: {
      invoke: {
        src: 'checkStoredSession',
        onDone: {
          target: 'authenticated',
          actions: assign({
            userId: ({ event }) => event.output.userId,
            sessionToken: ({ event }) => event.output.token
          })
        },
        onError: 'unauthenticated'
      }
    },

    unauthenticated: {
      on: {
        LOGIN: 'loggingIn',
        SIGNUP: 'signingUp'
      }
    },

    loggingIn: {
      invoke: {
        src: 'login',
        input: ({ event }) => event,
        onDone: {
          target: 'authenticated',
          actions: assign({
            userId: ({ event }) => event.output.userId,
            sessionToken: ({ event }) => event.output.token
          })
        },
        onError: {
          target: 'unauthenticated',
          actions: assign({
            error: ({ event }) => event.error.message
          })
        }
      }
    },

    signingUp: {
      // similar to loggingIn
    },

    authenticated: {
      on: {
        LOGOUT: 'loggingOut',
        SESSION_EXPIRED: 'unauthenticated'
      }
    },

    loggingOut: {
      invoke: {
        src: 'logout',
        onDone: 'unauthenticated'
      }
    }
  }
});
```

### 2. Chat Feature

**Файл:** `features/chat/index.js`

```javascript
import { chatMachine } from "./chat.machine.js";
import { spawn } from "xstate";

export const chatFeature = {
	id: "chat",
	name: "Chat",
	version: "1.0.0",

	dependencies: ["contacts", "crypto", "persistence"],

	async onMount(context) {
		const { actorRegistry } = context;

		const actor = spawn(chatMachine, {
			id: "chat",
			input: context,
		});

		actorRegistry.register("chat", actor, {
			type: "feature",
			featureId: "chat",
		});

		return { actor };
	},

	async onUnmount(context) {
		// Останавливаем все активные conversation actors
		const conversationActors = context.actorRegistry.getAll("conversation");
		for (const actor of conversationActors) {
			actor.stop();
		}

		context.actorRegistry.unregister("chat");
	},

	subscribedEvents: [
		"MESSAGE_RECEIVED",
		"CONTACT_SELECTED",
		"MESSAGES_BATCH_RECEIVED",
	],

	emittedEvents: [
		"MESSAGE_SENT",
		"MESSAGE_FAILED",
		"CONVERSATION_OPENED",
		"CONVERSATION_CLOSED",
	],

	ui: {
		components: {
			ChatWindow: () => import("./chat.ui.js").then((m) => m.ChatWindow),
			MessageList: () => import("./chat.ui.js").then((m) => m.MessageList),
			MessageComposer: () =>
				import("./chat.ui.js").then((m) => m.MessageComposer),
		},
	},
};
```

**Файл:** `features/chat/chat.machine.js`

```javascript
import { setup, spawn } from 'xstate';
import { conversationMachine } from './conversation.machine.js';

export const chatMachine = setup({
  types: {
    context: {} as {
      activeConversations: Map<string, ActorRef>,
      selectedContactId: string | null
    }
  }
}).createMachine({
  id: 'chat',

  context: {
    activeConversations: new Map(),
    selectedContactId: null
  },

  on: {
    CONTACT_SELECTED: {
      actions: assign({
        selectedContactId: ({ event }) => event.contactId
      }),
      // Открываем conversation, если ещё не открыт
      guard: ({ context, event }) => {
        return !context.activeConversations.has(event.contactId);
      },
      actions: ['spawnConversation']
    },

    MESSAGE_RECEIVED: {
      actions: 'forwardToConversation'
    }
  },

  actions: {
    spawnConversation: assign({
      activeConversations: ({ context, event, spawn }) => {
        const conversationActor = spawn(conversationMachine, {
          id: `conversation-${event.contactId}`,
          input: { contactId: event.contactId }
        });

        context.activeConversations.set(event.contactId, conversationActor);
        return context.activeConversations;
      }
    }),

    forwardToConversation: ({ context, event }) => {
      const actor = context.activeConversations.get(event.from);
      if (actor) {
        actor.send(event);
      }
    }
  }
});
```

### 3. Settings Feature (с кастомным signaling)

**Файл:** `features/settings/index.js`

```javascript
import { settingsMachine } from "./settings.machine.js";
import { spawn } from "xstate";

export const settingsFeature = {
	id: "settings",
	name: "Settings",
	version: "1.0.0",

	dependencies: ["persistence"],

	async onMount(context) {
		const actor = spawn(settingsMachine, {
			id: "settings",
			input: context,
		});

		context.actorRegistry.register("settings", actor, {
			type: "feature",
			featureId: "settings",
		});

		return { actor };
	},

	async onUnmount(context) {
		context.actorRegistry.unregister("settings");
	},

	subscribedEvents: ["APP_READY"],

	emittedEvents: [
		"SETTINGS_CHANGED",
		"SIGNALING_URL_CHANGED",
		"SIGNALING_TEST_SUCCESS",
		"SIGNALING_TEST_FAILED",
	],

	ui: {
		components: {
			SettingsPanel: () =>
				import("./settings.ui.js").then((m) => m.SettingsPanel),
			SignalingSettings: () =>
				import("./settings.ui.js").then((m) => m.SignalingSettings),
		},
	},
};
```

**Файл:** `features/settings/settings.machine.js`

```javascript
import { setup, fromPromise } from 'xstate';

export const settingsMachine = setup({
  types: {
    context: {} as {
      settings: {
        signaling: {
          mode: 'default' | 'custom',
          url: string | null,
          testStatus: 'success' | 'failed' | null,
          latency: number | null
        },
        theme: 'light' | 'dark',
        notifications: boolean
      }
    }
  },

  actors: {
    loadSettings: fromPromise(async ({ input }) => {
      const settings = await input.storage.get('user-settings');
      return settings || getDefaultSettings();
    }),

    saveSettings: fromPromise(async ({ input }) => {
      await input.storage.set('user-settings', input.settings);
    }),

    testSignalingURL: fromPromise(async ({ input }) => {
      const { url } = input;

      const startTime = performance.now();

      try {
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        if (data.service !== 'chat-signaling') {
          throw new Error('Invalid signaling server');
        }

        const latency = Math.round(performance.now() - startTime);

        return { success: true, latency };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })
  }
}).createMachine({
  id: 'settings',

  initial: 'loading',

  states: {
    loading: {
      invoke: {
        src: 'loadSettings',
        onDone: {
          target: 'idle',
          actions: assign({
            settings: ({ event }) => event.output
          })
        },
        onError: 'error'
      }
    },

    idle: {
      on: {
        UPDATE_SETTING: {
          actions: assign({
            settings: ({ context, event }) => {
              // Обновляем настройку по path
              return updateByPath(context.settings, event.path, event.value);
            }
          }),
          target: 'saving'
        },

        SET_SIGNALING_URL: {
          actions: assign({
            settings: ({ context, event }) => ({
              ...context.settings,
              signaling: {
                ...context.settings.signaling,
                url: event.url,
                mode: 'custom'
              }
            })
          }),
          target: 'saving'
        },

        TEST_SIGNALING_URL: 'testing',

        RESET_SIGNALING_URL: {
          actions: assign({
            settings: ({ context }) => ({
              ...context.settings,
              signaling: {
                mode: 'default',
                url: null,
                testStatus: null,
                latency: null
              }
            })
          }),
          target: 'saving'
        }
      }
    },

    testing: {
      invoke: {
        src: 'testSignalingURL',
        input: ({ event }) => ({ url: event.url }),
        onDone: {
          target: 'idle',
          actions: [
            assign({
              settings: ({ context, event }) => ({
                ...context.settings,
                signaling: {
                  ...context.settings.signaling,
                  testStatus: event.output.success ? 'success' : 'failed',
                  latency: event.output.latency || null
                }
              })
            }),
            sendParent(({ event }) => ({
              type: event.output.success ? 'SIGNALING_TEST_SUCCESS' : 'SIGNALING_TEST_FAILED',
              latency: event.output.latency,
              error: event.output.error
            }))
          ]
        }
      }
    },

    saving: {
      invoke: {
        src: 'saveSettings',
        input: ({ context }) => ({ settings: context.settings }),
        onDone: {
          target: 'idle',
          actions: sendParent(({ context }) => ({
            type: 'SETTINGS_CHANGED',
            settings: context.settings
          }))
        },
        onError: 'error'
      }
    },

    error: {
      on: {
        RETRY: 'loading'
      }
    }
  }
});

function getDefaultSettings() {
  return {
    signaling: {
      mode: 'default',
      url: null,
      testStatus: null,
      latency: null
    },
    theme: 'light',
    notifications: true
  };
}

function updateByPath(obj, path, value) {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}
```

### 4. Signaling Feature

**Файл:** `features/signaling/index.js`

```javascript
import { signalingMachine } from "./signaling.machine.js";
import { SignalingService } from "./signaling.service.js";
import { spawn } from "xstate";

export const signalingFeature = {
	id: "signaling",
	name: "Signaling",
	version: "1.0.0",

	dependencies: ["identity", "settings"],

	async onMount(context) {
		const { actorRegistry, eventBus } = context;

		// Создаём сервис
		const service = new SignalingService();

		// Spawn machine
		const actor = spawn(signalingMachine, {
			id: "signaling",
			input: { service, eventBus },
		});

		actorRegistry.register("signaling", actor, {
			type: "feature",
			featureId: "signaling",
		});

		return { actor, service };
	},

	async onUnmount(context) {
		const { service } = context;

		// Отключаемся от сервера
		if (service) {
			service.disconnect();
		}

		context.actorRegistry.unregister("signaling");
	},

	subscribedEvents: [
		"AUTH_SUCCESS",
		"SETTINGS_CHANGED",
		"SIGNALING_URL_CHANGED",
	],

	emittedEvents: [
		"SIGNALING_CONNECTED",
		"SIGNALING_DISCONNECTED",
		"CONNECTION_LOST",
		"MESSAGE_RECEIVED",
		"INVITE_RECEIVED",
	],
};
```

**Файл:** `features/signaling/signaling.service.js`

```javascript
export class SignalingService {
	constructor() {
		this.defaultURL = "https://functions.yandexcloud.net/d4e5xxxxxxxxxxxxxxxx";
		this.baseURL = this.defaultURL;
		this.userId = null;
		this.publicKey = null;
		this.abortController = null;
	}

	setCustomURL(url) {
		if (!url) {
			this.baseURL = this.defaultURL;
			return;
		}

		try {
			const parsed = new URL(url);
			if (!parsed.protocol.startsWith("http")) {
				throw new Error("Invalid protocol");
			}
			this.baseURL = url.replace(/\/$/, "");
		} catch (err) {
			throw new Error("Invalid URL format");
		}
	}

	getCurrentURL() {
		return this.baseURL;
	}

	isUsingDefaultServer() {
		return this.baseURL === this.defaultURL;
	}

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

				// Передаём события наружу через callback
				if (this.onServerEvent) {
					for (const event of events) {
						this.onServerEvent(event);
					}
				}
			} catch (err) {
				if (err.name === "AbortError") return;

				if (this.onError) {
					this.onError(err);
				}
			}

			if (!this.abortController.signal.aborted) {
				setTimeout(poll, 1000);
			}
		};

		poll();
	}

	stopPolling() {
		if (this.abortController) {
			this.abortController.abort();
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

	disconnect() {
		this.stopPolling();

		fetch(`${this.baseURL}/disconnect`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: this.userId }),
		}).catch(() => {});
	}
}
```

---

## 🔄 Коммуникация между фичами

### Правило изоляции

> **Фичи НЕ ЗНАЮТ друг о друге напрямую**

### Способы коммуникации

#### 1. Через EventBus (основной способ)

```javascript
// features/chat/chat.machine.js
// Отправляем событие
actions: {
	notifyMessageSent: ({ context, event }) => {
		eventBus.dispatch(
			{
				type: "MESSAGE_SENT",
				messageId: event.messageId,
				to: event.to,
				timestamp: Date.now(),
			},
			"HIGH"
		);
	};
}

// features/notifications/notifications.machine.js
// Слушаем событие
subscribedEvents: ["MESSAGE_SENT"];

// При регистрации автоматически подписываемся
```

#### 2. Через зависимости (при необходимости)

```javascript
// features/chat/index.js
export const chatFeature = {
	id: "chat",
	dependencies: ["crypto", "persistence"],

	async onMount(context) {
		// Можем получить доступ к смонтированным зависимостям
		const cryptoResult = context.featureRegistry.getMountResult("crypto");
		const { service: cryptoService } = cryptoResult;

		// Используем сервис
		const encrypted = await cryptoService.encrypt(message);
	},
};
```

#### 3. Через shared state (осторожно!)

```javascript
// core/shared-state.js
export const sharedState = {
	currentUser: null,
	onlineStatus: "online",
};

// Фичи могут читать, но не должны полагаться на это
// Всегда предпочитайте события!
```

### Event Flow Diagram

```
┌──────────────┐
│   Feature A  │
│   (chat)     │
└──────┬───────┘
       │ send message
       │
       ▼
┌──────────────────┐
│    EventBus      │  ← Priority Queue
│  HIGH/MEDIUM/LOW │
└──────┬───────────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  Feature B   │      │  Feature C   │
│ (notifs)     │      │ (persistence)│
└──────────────┘      └──────────────┘
 subscribes to         subscribes to
 MESSAGE_SENT          MESSAGE_SENT
```

### Event Naming Convention

```javascript

// Формат: ENTITY_ACTION или ACTION_STATUS

// ✅ Хорошо
'MESSAGE_SENT'
'MESSAGE_RECEIVED'
'USER_LOGGED_IN'
'CONTACT_ADDED'
'SETTINGS_CHANGED'
'CRYPTO_ENCRYPTION_FAILED'

// ❌ Плохо
'send-message'      // kebab-case
'MessageSent'       // PascalCase
'msg_sent'          // сокращения
'SENT'              // неясно что
```

### Priority Guidelines

| Event Type | Priority | Example |
|------------|----------|---------|
| Critical messages | HIGH | `MESSAGE_RECEIVED`, `AUTH_SUCCESS` |
| User actions | MEDIUM | `CONTACT_SELECTED`, `SETTINGS_CHANGED` |
| UI updates | LOW | `TYPING_STARTED`, `PRESENCE_CHANGED` |
| Analytics | LOW | `PAGE_VIEW`, `BUTTON_CLICKED` |

---

## 🆕 Добавление новой фичи

### Пошаговый guide

Допустим, хотим добавить фичу "voice messages" (голосовые сообщения).

#### Шаг 1: Создаём структуру

```bash
mkdir -p src/features/voice-messages
cd src/features/voice-messages

touch index.js
touch voice-messages.machine.js
touch voice-messages.service.js
touch voice-messages.ui.js
touch voice-messages.events.js  # опционально
```

#### Шаг 2: Определяем контракт

**`features/voice-messages/index.js`:**

```javascript
import { voiceMessagesMachine } from './voice-messages.machine.js';
import { VoiceMessagesService } from './voice-messages.service.js';
import { spawn } from 'xstate';

export const voiceMessagesFeature = {
  id: 'voice-messages',
  name: 'Voice Messages',
  version: '1.0.0',
  
  // Зависимости
  dependencies: [
    'chat',        // нужен для отправки сообщений
    'crypto',      // нужен для шифрования аудио
    'persistence'  // нужен для кеширования
  ],
  
  async onMount(context) {
    const { actorRegistry } = context;
    
    // Создаём сервис
    const service = new VoiceMessagesService();
    
    // Spawn machine
    const actor = spawn(voiceMessagesMachine, {
      id: 'voice-messages',
      input: { service, context }
    });
    
    actorRegistry.register('voice-messages', actor, {
      type: 'feature',
      featureId: 'voice-messages'
    });
    
    console.log('🎤 Voice Messages feature mounted');
    
    return { actor, service };
  },
  
  async onUnmount(context) {
    // Останавливаем запись, если идёт
    const { service } = context;
    if (service) {
      await service.stopRecording();
    }
    
    context.actorRegistry.unregister('voice-messages');
    
    console.log('🎤 Voice Messages feature unmounted');
  },
  
  // События, которые слушаем
  subscribedEvents: [
    'CONVERSATION_OPENED',  // когда открыли диалог
    'CONVERSATION_CLOSED'   // когда закрыли
  ],
  
  // События, которые отправляем
  emittedEvents: [
    'VOICE_RECORDING_STARTED',
    'VOICE_RECORDING_STOPPED',
    'VOICE_MESSAGE_SENT',
    'VOICE_MESSAGE_FAILED'
  ],
  
  // UI компоненты
  ui: {
    components: {
      VoiceRecorder: () => import('./voice-messages.ui.js').then(m => m.VoiceRecorder),
      VoicePlayer: () => import('./voice-messages.ui.js').then(m => m.VoicePlayer)
    }
  },
  
  // Настройки по умолчанию
  settings: {
    maxDuration: 120000,  // 2 минуты
    format: 'webm',
    codec: 'opus'
  }
};
```

#### Шаг 3: Реализуем machine

**`features/voice-messages/voice-messages.machine.js`:**

```javascript
import { setup, fromPromise } from 'xstate';

export const voiceMessagesMachine = setup({
  types: {
    context: {} as {
      isRecording: boolean,
      audioBlob: Blob | null,
      duration: number,
      error: string | null
    }
  },
  
  actors: {
    startRecording: fromPromise(async ({ input }) => {
      const { service } = input;
      return await service.startRecording();
    }),
    
    stopRecording: fromPromise(async ({ input }) => {
      const { service } = input;
      return await service.stopRecording();
    }),
    
    sendVoiceMessage: fromPromise(async ({ input }) => {
      const { audioBlob, contactId, cryptoService } = input;
      
      // Конвертируем в base64
      const base64 = await blobToBase64(audioBlob);
      
      // Шифруем
      const encrypted = await cryptoService.encrypt(base64);
      
      // Отправляем через chat feature (событие)
      return { encrypted, contactId };
    })
  }
}).createMachine({
  id: 'voice-messages',
  
  initial: 'idle',
  
  context: {
    isRecording: false,
    audioBlob: null,
    duration: 0,
    error: null
  },
  
  states: {
    idle: {
      on: {
        START_RECORDING: 'recording'
      }
    },
    
    recording: {
      entry: assign({
        isRecording: true,
        duration: 0,
        audioBlob: null
      }),
      
      invoke: {
        src: 'startRecording',
        input: ({ context }) => ({ service: context.service }),
        onDone: {
          target: 'recorded',
          actions: assign({
            audioBlob: ({ event }) => event.output.blob,
            duration: ({ event }) => event.output.duration
          })
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error.message
          })
        }
      },
      
      on: {
        STOP_RECORDING: 'stopping',
        CANCEL_RECORDING: 'idle'
      }
    },
    
    stopping: {
      invoke: {
        src: 'stopRecording',
        input: ({ context }) => ({ service: context.service }),
        onDone: {
          target: 'recorded',
          actions: assign({
            audioBlob: ({ event }) => event.output.blob,
            duration: ({ event }) => event.output.duration,
            isRecording: false
          })
        }
      }
    },
    
    recorded: {
      on: {
        SEND: 'sending',
        CANCEL: 'idle',
        RE_RECORD: 'recording'
      }
    },
    
    sending: {
      invoke: {
        src: 'sendVoiceMessage',
        input: ({ context, event }) => ({
          audioBlob: context.audioBlob,
          contactId: event.contactId,
          cryptoService: event.cryptoService
        }),
        onDone: {
          target: 'idle',
          actions: [
            assign({
              audioBlob: null,
              duration: 0
            }),
            sendParent(({ event }) => ({
              type: 'VOICE_MESSAGE_SENT',
              ...event.output
            }))
          ]
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => event.error.message
            }),
            sendParent({
              type: 'VOICE_MESSAGE_FAILED'
            })
          ]
        }
      }
    },
    
    error: {
      on: {
        RETRY: 'idle',
        DISMISS: 'idle'
      }
    }
  }
});

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

#### Шаг 4: Реализуем service

**`features/voice-messages/voice-messages.service.js`:**

```javascript
export class VoiceMessagesService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = null;
  }
  
  async startRecording() {
    // Запрашиваем разрешение на микрофон
    this.stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });
    
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.audioChunks = [];
    this.startTime = Date.now();
    
    this.mediaRecorder.ondataavailable = (e) => {
      this.audioChunks.push(e.data);
    };
    
    this.mediaRecorder.start();
    
    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = Date.now() - this.startTime;
        
        // Останавливаем stream
        this.stream.getTracks().forEach(track => track.stop());
        
        resolve({ blob, duration });
      };
      
      this.mediaRecorder.onerror = reject;
    });
  }
  
  async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
  
  async cancelRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.audioChunks = [];
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    }
  }
}
```

#### Шаг 5: Реализуем UI

**`features/voice-messages/voice-messages.ui.js`:**

```javascript
import { LitElement, html, css } from 'lit';

export class VoiceRecorder extends LitElement {
  static properties = {
    voiceActor: { type: Object },
    state: { type: Object }
  };
  
  static styles = css`
    :host {
      display: block;
    }
    
    .recorder {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-surface);
      border-radius: 1rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
    
    .record-btn {
      background: var(--color-error);
      color: white;
    }
    
    .recording {
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  
  connectedCallback() {
    super.connectedCallback();
    
    if (this.voiceActor) {
      this.unsubscribe = this.voiceActor.subscribe((snapshot) => {
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
  
  handleRecord() {
    if (this.state.matches('idle')) {
      this.voiceActor.send({ type: 'START_RECORDING' });
    } else if (this.state.matches('recording')) {
      this.voiceActor.send({ type: 'STOP_RECORDING' });
    }
  }
  
  handleSend() {
    this.voiceActor.send({ 
      type: 'SEND',
      contactId: this.contactId,
      cryptoService: this.cryptoService
    });
  }
  
  handleCancel() {
    this.voiceActor.send({ type: 'CANCEL' });
  }
  
  render() {
    if (!this.state) {
      return html``;
    }
    
    const isIdle = this.state.matches('idle');
    const isRecording = this.state.matches('recording');
    const isRecorded = this.state.matches('recorded');
    const isSending = this.state.matches('sending');
    
    return html`
      <div class="recorder">
        ${isIdle || isRecording ? html`
          <button 
            class="record-btn ${isRecording ? 'recording' : ''}"
            @click=${this.handleRecord}
          >
            ${isRecording ? '⏸️ Stop' : '🎤 Record'}
          </button>
          
          ${isRecording ? html`
            <span class="duration">
              ${this.formatDuration(this.state.context.duration)}
            </span>
          ` : ''}
        ` : ''}
        
        ${isRecorded ? html`
          <button @click=${this.handleSend}>
            ✅ Send
          </button>
          <button @click=${this.handleCancel}>
            ❌ Cancel
          </button>
          <span>
            Duration: ${this.formatDuration(this.state.context.duration)}
          </span>
        ` : ''}
        
        ${isSending ? html`
          <span>Sending...</span>
        ` : ''}
      </div>
    `;
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

customElements.define('voice-recorder', VoiceRecorder);


export class VoicePlayer extends LitElement {
  // ... аналогично
}

customElements.define('voice-player', VoicePlayer);
```

#### Шаг 6: Регистрируем фичу

**`runtime/bootstrap.js`:**

```javascript
import { voiceMessagesFeature } from '../features/voice-messages/index.js';

export async function bootstrap() {
  // ... остальные фичи
  
  // Добавляем новую фичу
  featureRegistry.register(voiceMessagesFeature);
  
  // Всё! Фича автоматически смонтируется в правильном порядке
}
```

#### Шаг 7: Интеграция с UI (опционально)

**`features/chat/chat.ui.js`:**

```javascript
// В компоненте чата добавляем кнопку записи
import '../voice-messages/voice-messages.ui.js';

render() {
  return html`
    <div class="composer">
      <input type="text" />
      
      <!-- Кнопка записи голосового -->
      <voice-recorder 
        .voiceActor=${this.getVoiceActor()}
        .contactId=${this.contactId}
      ></voice-recorder>
      
      <button>Send</button>
    </div>
  `;
}

getVoiceActor() {
  // Получаем актор из registry
  return actorRegistry.get('voice-messages');
}
```

### Итого

**Что мы сделали:**

1. ✅ Создали папку `features/voice-messages/`
2. ✅ Написали контракт в `index.js`
3. ✅ Реализовали machine, service, UI
4. ✅ Зарегистрировали в `bootstrap.js`

**Что НЕ пришлось делать:**

- ❌ Править AppMachine
- ❌ Править роутинг
- ❌ Править другие фичи
- ❌ Править core infrastructure

**Фича полностью автономна** и может быть:
- Включена/выключена одной строкой
- Удалена удалением папки
- Протестирована изолированно

---

## ✨ Best Practices

### 1. Feature Design

#### ✅ DO:

```javascript
// Фича инкапсулирует всю свою логику
features/notifications/
  index.js
  notifications.machine.js
  notifications.service.js
  notifications.ui.js

// Явные зависимости
dependencies: ['chat', 'contacts']

// События с понятными именами
emittedEvents: ['NOTIFICATION_SHOWN', 'NOTIFICATION_DISMISSED']
```

#### ❌ DON'T:

```javascript
// НЕ импортируйте напрямую из других фич
import { chatMachine } from '../chat/chat.machine.js'; // ❌

// НЕ полагайтесь на internal state других фич
const chatState = context.chat.state; // ❌

// НЕ используйте глобальные переменные для связи
window.currentUser = user; // ❌
```

### 2. Event Design

#### ✅ DO:

```javascript
// Описательные имена
'MESSAGE_SENT'
'USER_LOGGED_IN'
'SETTINGS_CHANGED'

// Включайте необходимые данные
{
  type: 'MESSAGE_SENT',
  messageId: '123',
  to: 'user456',
  timestamp: Date.now()
}

// Документируйте события
emittedEvents: [
  'MESSAGE_SENT',      // когда сообщение отправлено
  'MESSAGE_FAILED'     // когда отправка провалилась
]
```

#### ❌ DON'T:

```javascript
// Неясные имена
'DONE' // ❌
'UPDATE' // ❌
'PROCESS' // ❌

// Слишком много данных
{
  type: 'MESSAGE_SENT',
  message: { /* весь объект сообщения */ }, // ❌
  user: { /* весь профиль */ }, // ❌
}

// Недокументированные события
emittedEvents: ['EVT1', 'EVT2'] // ❌
```

### 3. Dependencies

#### ✅ DO:

```javascript
// Явные зависимости
dependencies: ['persistence', 'crypto']

// Минимальные зависимости
dependencies: ['chat'] // только то, что действительно нужно

// Через события, где возможно
// Вместо зависимости от 'notifications'
eventBus.dispatch({ type: 'SHOW_NOTIFICATION' })
```

#### ❌ DON'T:

```javascript
// Циклические зависимости
// chat -> groups -> chat ❌

// Слишком много зависимостей
dependencies: ['a', 'b', 'c', 'd', 'e', 'f'] // ❌

// Неявные зависимости
// Используем, но не декларируем
const cryptoService = getCryptoService(); // ❌
```

### 4. State Management

#### ✅ DO:

```javascript
// Держите state внутри фичи
context: {
  messages: [],
  selectedId: null
}

// Используйте machine для логики
states: {
  idle: {},
  loading: {},
  error: {}
}

// Persist критичные данные
onUnmount: async (context) => {
  await storage.save('feature-state', context.state);
}
```

#### ❌ DON'T:

```javascript
// Не используйте глобальный state
window.appState.messages = [...]; // ❌

// Не храните state в DOM
element.dataset.state = JSON.stringify(state); // ❌

// Не забывайте про cleanup
onUnmount: () => {
  // забыли остановить timers ❌
}
```

### 5. Testing

#### ✅ DO:

```javascript
// Тестируйте изолированно
describe('Voice Messages Feature', () => {
  it('should start recording', async () => {
    const actor = createActor(voiceMessagesMachine);
    actor.start();
    
    actor.send({ type: 'START_RECORDING' });
    
    await waitFor(actor, (state) => state.matches('recording'));
    expect(actor.getSnapshot().context.isRecording).toBe(true);
  });
});

// Mock зависимости
const mockCrypto = {
  encrypt: vi.fn().mockResolvedValue('encrypted')
};

// Тестируйте события
it('should emit VOICE_MESSAGE_SENT', async () => {
  const events = [];
  eventBus.on('VOICE_MESSAGE_SENT', (e) => events.push(e));
  
  // trigger action
  
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('VOICE_MESSAGE_SENT');
});
```

### 6. Performance

#### ✅ DO:

```javascript
// Lazy load UI компонентов
ui: {
  components: {
    Heavy: () => import('./heavy-component.js')
  }
}

// Cleanup при unmount
onUnmount: () => {
  clearInterval(this.pollInterval);
  this.worker.terminate();
}

// Используйте workers для тяжёлых операций
const worker = new Worker('./feature.worker.js');
```

#### ❌ DON'T:

```javascript
// Не грузите всё сразу
import HeavyComponent from './heavy-component.js'; // ❌

// Не забывайте про cleanup
onUnmount: () => {
  // забыли остановить worker ❌
}

// Не блокируйте main thread
for (let i = 0; i < 1000000; i++) { /* heavy */ } // ❌
```

### 7. Error Handling

#### ✅ DO:

```javascript
// Обрабатывайте ошибки в machine
states: {
  processing: {
    invoke: {
      src: 'heavyOperation',
      onError: {
        target: 'error',
        actions: 'logError'
      }
    }
  },
  error: {
    on: {
      RETRY: 'processing'
    }
  }
}

// Emit события об ошибках
eventBus.dispatch({
  type: 'FEATURE_ERROR',
  featureId: 'voice-messages',
  error: err.message
}, 'HIGH');

// Graceful degradation
onUnmount: async () => {
  try {
    await cleanup();
  } catch (err) {
    console.error('Cleanup failed:', err);
    // но не крашим приложение
  }
}
```

---

## 📊 Метрики и мониторинг

### Observability для фич

```javascript
// core/metrics.js
export class FeatureMetrics {
  track(featureId, metric, value) {
    metrics.gauge(`feature.${featureId}.${metric}`, value);
  }
  
  increment(featureId, event) {
    metrics.increment(`feature.${featureId}.events.${event}`);
  }
  
  timing(featureId, operation, duration) {
    metrics.timing(`feature.${featureId}.${operation}`, duration);
  }
}

// В фиче
actions: {
  trackEvent: ({ context }) => {
    featureMetrics.increment('voice-messages', 'recording_started');
  }
}
```

### Полезные метрики

- `feature.{id}.mounted` - когда фича смонтирована
- `feature.{id}.events.{type}` - счётчик событий
- `feature.{id}.errors` - счётчик ошибок
- `feature.{id}.active_actors` - количество акторов
- `feature.{id}.operation.{name}` - timing операций

---

## 🎓 Заключение

### Что мы получили

**Feature-Based Architecture** даёт нам:

1. **Модульность** - каждая фича независима
2. **Масштабируемость** - легко добавлять новые фичи
3. **Поддерживаемость** - изменения локализованы
4. **Тестируемость** - фичи тестируются изолированно
5. **Гибкость** - легко включать/выключать фичи

### Ключевые принципы (напоминание)

> **Фича = минимальная автономная причина изменения**

1. ✅ Фича содержит ВСЁ необходимое
2. ✅ Фичи изолированы друг от друга
3. ✅ Связь только через события/контракты
4. ✅ Никто снаружи не знает, как фича устроена
5. ✅ Добавление фичи = создание папки + регистрация

### Сравнение с layered

**До (layered):**
```
Добавить фичу = править в 7+ местах
Удалить фичу = искать по всему коду
Изменить фичу = риск сломать другие
```

**После (feature-based):**
```
Добавить фичу = 1 папка + 1 строка регистрации
Удалить фичу = удалить папку + убрать регистрацию  
Изменить фичу = править только внутри папки
```

### Production Checklist

- ✅ Все фичи зарегистрированы
- ✅ Зависимости корректно указаны
- ✅ События документированы
- ✅ Cleanup реализован
- ✅ Error handling есть
- ✅ UI компоненты lazy-loaded
- ✅ Workers используются для тяжёлых операций
- ✅ Метрики настроены
- ✅ Tests написаны

### Дальнейшее развитие

Архитектура легко расширяется:

- **Feature Flags** - включение/выключение через конфиг
- **A/B Testing** - разные версии фич
- **Plugin System** - динамическая загрузка фич
- **Federation** - фичи из разных источников
- **Hot Reload** - обновление фич без перезагрузки

---

## 📚 Приложение: Полная структура

```
chat-app/
├── public/
│   ├── index.html
│   ├── sw.js
│   ├── manifest.json
│   └── workers/
│       ├── crypto.worker.js
│       └── media.worker.js
│
├── src/
│   ├── features/                     🎯 ВСЕ ФИЧИ
│   │   ├── auth/
│   │   │   ├── index.js
│   │   │   ├── auth.machine.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.ui.js
│   │   ├── identity/
│   │   ├── contacts/
│   │   ├── chat/
│   │   │   ├── index.js
│   │   │   ├── chat.machine.js
│   │   │   ├── conversation.machine.js
│   │   │   ├── chat.service.js
│   │   │   └── chat.ui.js
│   │   ├── groups/
│   │   ├── signaling/
│   │   │   ├── index.js
│   │   │   ├── signaling.machine.js
│   │   │   └── signaling.service.js
│   │   ├── settings/
│   │   │   ├── index.js
│   │   │   ├── settings.machine.js
│   │   │   └── settings.ui.js
│   │   ├── crypto/
│   │   │   ├── index.js
│   │   │   └── crypto.service.js
│   │   ├── persistence/
│   │   │   ├── index.js
│   │   │   └── persistence.service.js
│   │   ├── notifications/
│   │   ├── shell/
│   │   │   ├── index.js
│   │   │   ├── shell.machine.js
│   │   │   └── shell.ui.js
│   │   ├── streams/
│   │   └── voice-messages/          ← новая фича
│   │       ├── index.js
│   │       ├── voice-messages.machine.js
│   │       ├── voice-messages.service.js
│   │       └── voice-messages.ui.js
│   │
│   ├── core/                         🔧 INFRASTRUCTURE
│   │   ├── app-machine.js           ← root orchestrator
│   │   ├── event-bus.js             ← priority events
│   │   ├── feature-registry.js      ← регистрация фич
│   │   ├── actor-registry.js        ← управление акторами
│   │   ├── lifecycle.js             ← lifecycle hooks
│   │   └── error-boundary.js        ← error handling
│   │
│   ├── runtime/                      📊 OBSERVABILITY
│   │   ├── bootstrap.js             ← entry point
│   │   ├── logger.js
│   │   ├── metrics.js
│   │   ├── performance-monitor.js
│   │   ├── memory-manager.js
│   │   └── rate-limiters.js
│   │
│   ├── shared/                       🛠️ SHARED (optional)
│   │   ├── utils/
│   │   └── constants.js
│   │
│   └── main.js                       ← вызывает bootstrap()
│
├── package.json
├── vite.config.js
└── README.md
```

---

**Теперь у нас чистая, масштабируемая, поддерживаемая архитектура!** 🚀

Каждая фича - это автономный вертикальный срез. Добавление нового функционала = создание папки + одна строка регистрации. Всё изолировано, всё тестируемо, всё понятно.
