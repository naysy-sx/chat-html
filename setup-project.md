```sh
npm init -y
npm install xstate lit
npm install --save-dev vite vite-plugin-singlefile
```

### vite.config.js

```js
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	root: "public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		target: "esnext",
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		rollupOptions: {
			input: {
				main: "public/index.html",
			},
			output: {
				inlineDynamicImports: true,
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
		open: true,
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
});
```

### 4.3 `.gitignore`

```
# Dependencies
node_modules/

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

### public/manifest.json

```
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

### public/sw.js

```
const CACHE_NAME = 'chat-app-v0.3.0'
const urlsToCache = [
  '/',
  '/index.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

### src/main.js

```

console.log('🚀 Chat App v0.3.0 starting...')

// Проверка поддержки браузера
const checkBrowserSupport = () => {
const required = {
'IndexedDB': 'indexedDB' in window,
'Web Crypto': 'crypto' in window && 'subtle' in window.crypto,
'Web Workers': 'Worker' in window,
'Service Workers': 'serviceWorker' in navigator,
'ES Modules': true // если скрипт загрузился, значит поддерживается
}

const missing = Object.entries(required)
.filter(([_, supported]) => !supported)
.map(([feature]) => feature)

if (missing.length > 0) {
document.body.innerHTML = `      <div style="padding: 2rem; text-align: center;">
        <h1>❌ Browser not supported</h1>
        <p>Your browser is missing required features:</p>
        <ul style="list-style: none; padding: 0;">
          ${missing.map(f =>`<li>• ${f}</li>`).join('')}
        </ul>
        <p style="margin-top: 2rem;">
          Please use a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    `
return false
}

return true
}

if (!checkBrowserSupport()) {
throw new Error('Browser not supported')
}

// TODO: Инициализация приложения
console.log('✅ Browser check passed')
console.log('⏳ Initializing...')

// Пока просто заглушка
document.getElementById('app').innerHTML = `

  <div style="padding: 2rem; text-align: center;">
    <h1>🎉 Chat App</h1>
    <p>Ready to build!</p>
  </div>
`
```

### Полезное

rm -rf node_modules package-lock.json
npm install

# Обновление зависимостей до latest версий

npm update

# Проверка устаревших пакетов

npm outdated

# Audit безопасности

npm audit

# Запуск с debug логами

DEBUG=vite:\* npm run dev
