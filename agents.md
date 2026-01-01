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

```
