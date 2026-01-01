# 🚀 Настройка проекта Chat App

Инструкция по настройке и запуску приложения на основе Feature-Based Architecture.

---

## 📋 Содержание

1. [Требования](#требования)
2. [Установка зависимостей](#установка-зависимостей)
3. [Структура проекта](#структура-проекта)
4. [Конфигурация](#конфигурация)
5. [Запуск приложения](#запуск-приложения)
6. [Архитектура](#архитектура)
7. [Добавление новой фичи](#добавление-новой-фичи)
8. [Полезные команды](#полезные-команды)

---

## 🔧 Требования

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Современный браузер с поддержкой:
  - ES Modules
  - IndexedDB
  - Web Crypto API
  - Web Workers (опционально)

---

## 📦 Установка зависимостей

### Инициализация проекта

```bash
npm init -y
```

### Установка основных зависимостей

```bash
npm install xstate lit
```

- **xstate** (^5.25.0) - State machines для управления состоянием
- **lit** (^3.3.2) - Web Components библиотека для UI

### Установка dev-зависимостей

```bash
npm install --save-dev vite vite-plugin-singlefile
```

- **vite** (^7.3.0) - Сборщик и dev-сервер
- **vite-plugin-singlefile** (^2.3.0) - Плагин для сборки в один HTML файл

---

## 📂 Структура проекта

```
chat-html/
├── public/                    # Статические файлы
│   ├── index.html            # Точка входа
│   ├── manifest.json         # PWA манифест (опционально)
│   ├── sw.js                 # Service Worker (опционально)
│   └── workers/              # Web Workers
│       ├── crypto.worker.js
│       └── media.worker.js
│
├── src/
│   ├── core/                 # 🔧 Инфраструктура
│   │   ├── event-bus.js     # Priority Event Bus
│   │   ├── feature-registry.js  # Реестр фич
│   │   ├── actor-registry.js    # Управление акторами
│   │   ├── app-machine.js       # Корневая машина
│   │   ├── lifecycle.js         # Lifecycle hooks (опционально)
│   │   └── error-boundary.js    # Error handling (опционально)
│   │
│   ├── features/              # 🎯 Фичи (вертикальные срезы)
│   │   ├── auth/             # ✅ Аутентификация
│   │   ├── identity/         # ✅ Управление профилем
│   │   ├── persistence/      # ✅ Хранилище (IndexedDB)
│   │   ├── crypto/            # ✅ Криптография
│   │   ├── shell/            # ✅ UI оболочка
│   │   ├── contacts/         # ⏳ Контакты
│   │   ├── chat/             # ⏳ Чаты
│   │   ├── groups/           # ⏳ Группы
│   │   ├── signaling/        # ⏳ Сигнальный сервер
│   │   ├── settings/          # ⏳ Настройки
│   │   ├── notifications/    # ⏳ Уведомления
│   │   └── streams/          # ⏳ Видео/аудио
│   │
│   ├── runtime/               # 📊 Observability & Utils
│   │   ├── bootstrap.js      # ✅ Инициализация
│   │   ├── logger.js         # ⏳ Логирование
│   │   ├── metrics.js        # ⏳ Метрики
│   │   └── ...
│   │
│   ├── shared/                # 🛠️ Общие утилиты
│   │   ├── constants.js
│   │   └── utils/
│   │
│   └── main.js                # ✅ Точка входа
│
├── package.json
├── vite.config.js
├── agents.md                  # 📚 Архитектурная документация
└── setup-project.md           # 📖 Эта инструкция
```

**Легенда:**

- ✅ - Реализовано
- ⏳ - В разработке
- 🔧 - Инфраструктура
- 🎯 - Фичи
- 📊 - Observability
- 🛠️ - Утилиты

---

## ⚙️ Конфигурация

### vite.config.js

```js
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	publicDir: "public", // Статические файлы (workers, sw.js, manifest.json)

	build: {
		outDir: "dist",
		emptyOutDir: true,
		target: "esnext",
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true, // Удаляем console.log в production
				drop_debugger: true,
			},
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true, // Для single-file сборки
			},
		},
	},

	plugins: [
		viteSingleFile({
			removeViteModuleLoader: true,
		}),
	],

	server: {
		port: 3000,
		open: true, // Автоматически открывает браузер
	},

	resolve: {
		alias: {
			"@": "/src", // Алиас для импортов (опционально)
		},
	},
});
```

### package.json scripts

```json
{
	"scripts": {
		"dev": "vite", // Запуск dev-сервера
		"build": "vite build", // Production сборка
		"preview": "vite preview" // Просмотр production сборки
	}
}
```

### .gitignore

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build output
dist/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Temporary
.cache/
.temp/
```

---

## 🚀 Запуск приложения

### Development режим

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:3000`

### Production сборка

```bash
npm run build
```

Результат в папке `dist/index.html` (single-file)

### Просмотр production сборки

```bash
npm run preview
```

---

## 🏗️ Архитектура

### Feature-Based Architecture

Приложение построено на принципе **Feature-Based Architecture**, где каждая фича - это вертикальный срез функциональности.

**Принципы:**

- ✅ **Изоляция** - фича не знает о других фичах напрямую
- ✅ **Автономность** - фича содержит всё необходимое (machine, service, UI)
- ✅ **Явная связь** - только через события (EventBus) и зависимости
- ✅ **Расширяемость** - новая фича не трогает старые

### Текущая реализация

**Реализованные фичи:**

1. **persistence** - IndexedDB хранилище (базовая, без зависимостей)
2. **crypto** - Криптография (базовая, без зависимостей)
3. **identity** - Управление профилями (зависит от: persistence, crypto)
4. **auth** - Аутентификация (зависит от: identity, persistence)
5. **shell** - UI оболочка (зависит от: auth)

**Core инфраструктура:**

- `event-bus.js` - Priority Event Bus для коммуникации
- `feature-registry.js` - Реестр и монтирование фич
- `actor-registry.js` - Управление lifecycle акторов
- `app-machine.js` - Корневая машина состояния

**Жизненный цикл:**

1. `main.js` → вызывает `bootstrap()`
2. `bootstrap.js` → регистрирует все фичи
3. `app-machine.js` → монтирует фичи (с учётом зависимостей)
4. Приложение готово → фичи начинают работу

### Коммуникация между фичами

Фичи общаются **только через EventBus**:

```javascript
// Фича A отправляет событие
eventBus.dispatch({ type: "MESSAGE_SENT", data }, "HIGH");

// Фича B подписана на событие
subscribedEvents: ["MESSAGE_SENT"];
```

---

## ➕ Добавление новой фичи

### Шаг 1: Создать структуру

```bash
mkdir -p src/features/my-feature
touch src/features/my-feature/{index.js,machine.js,service.js,ui.js}
```

### Шаг 2: Реализовать Feature Contract

**`src/features/my-feature/index.js`:**

```javascript
import { myFeatureMachine } from "./machine.js";
import { spawn } from "xstate";

export const myFeature = {
	id: "my-feature",
	name: "My Feature",
	version: "1.0.0",

	dependencies: ["persistence"], // Опционально

	async onMount(context) {
		const { eventBus, actorRegistry } = context;

		const actor = spawn(myFeatureMachine, {
			id: "my-feature",
		});

		actorRegistry.register("my-feature", actor, {
			type: "feature",
			featureId: "my-feature",
		});

		return { actor };
	},

	async onUnmount(context) {
		context.actorRegistry.unregister("my-feature");
	},

	subscribedEvents: ["APP_READY"],
	emittedEvents: ["MY_FEATURE_EVENT"],
};
```

### Шаг 3: Зарегистрировать в bootstrap

**`src/runtime/bootstrap.js`:**

```javascript
import { myFeature } from "../features/my-feature/index.js";

// В функции bootstrap():
featureRegistry.register(myFeature);
```

### Шаг 4: Порядок регистрации не важен!

FeatureRegistry автоматически разрешит зависимости и смонтирует фичи в правильном порядке.

---

## 🛠️ Полезные команды

### Очистка и переустановка

```bash
# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install
```

### Обновление зависимостей

```bash
# Обновить до latest версий
npm update

# Проверить устаревшие пакеты
npm outdated
```

### Безопасность

```bash
# Проверка уязвимостей
npm audit

# Автоматическое исправление
npm audit fix
```

### Отладка

```bash
# Запуск с debug логами Vite
DEBUG=vite:* npm run dev

# Проверка структуры проекта
tree -L 3 -I node_modules
```

### Проверка кода

```bash
# Проверка синтаксиса (если установлен ESLint)
npm run lint

# Проверка типов (если используется TypeScript)
npm run type-check
```

---

## 📝 Опциональные файлы

### public/manifest.json (PWA)

```json
{
	"name": "Chat App",
	"short_name": "Chat",
	"description": "Decentralized P2P Chat with E2EE",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#ffffff",
	"theme_color": "#4f46e5",
	"orientation": "portrait",
	"icons": [
		{
			"src": "/icon-192.png",
			"sizes": "192x192",
			"type": "image/png"
		},
		{
			"src": "/icon-512.png",
			"sizes": "512x512",
			"type": "image/png"
		}
	]
}
```

### public/sw.js (Service Worker)

```javascript
const CACHE_NAME = "chat-app-v1.0.0";
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

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
```

**Регистрация в `index.html`:**

```html
<script>
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("/sw.js");
	}
</script>
```

---

## 🐛 Troubleshooting

### Проблема: "Module not found"

**Решение:** Проверьте пути импортов. Используйте относительные пути:

```javascript
import { something } from "../other-feature/index.js";
```

### Проблема: "Circular dependency detected"

**Решение:** Проверьте зависимости фич. Убедитесь, что нет циклических зависимостей.

### Проблема: "Feature X depends on Y, but Y is not registered"

**Решение:** Убедитесь, что все зависимости зарегистрированы в `bootstrap.js`.

### Проблема: IndexedDB не работает

**Решение:**

- Проверьте, что браузер поддерживает IndexedDB
- Откройте DevTools → Application → IndexedDB
- Проверьте консоль на ошибки

### Проблема: Приложение не запускается

**Решение:**

1. Проверьте консоль браузера на ошибки
2. Убедитесь, что все зависимости установлены: `npm install`
3. Проверьте, что порт 3000 свободен
4. Попробуйте очистить кэш: `rm -rf node_modules/.vite`

---

## 📚 Дополнительные ресурсы

- **Архитектурная документация:** `agents.md`
- **XState документация:** https://stately.ai/docs
- **Lit документация:** https://lit.dev/docs/
- **Vite документация:** https://vitejs.dev/

---

## ✅ Чеклист для нового разработчика

- [ ] Установлены зависимости (`npm install`)
- [ ] Приложение запускается (`npm run dev`)
- [ ] Понимание Feature-Based Architecture
- [ ] Прочитана документация в `agents.md`
- [ ] Знакомство с XState и Lit
- [ ] Настроен редактор (рекомендуется VSCode)

---

**Готово!** 🎉 Теперь вы можете начать разработку!
