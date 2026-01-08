// src/features/auth/index.js

import { createAuthMachine } from './auth.machine.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { createActor } from 'xstate';

import './auth.ui.js';

// Встраиваем CryptoService прямо сюда (или можно вынести в auth.crypto.js)
class AuthCryptoService {
	constructor(workerUrl = '/workers/crypto.worker.js') {
		this.workerUrl = workerUrl;
		this.worker = null;
		this.pending = new Map();
		this.requestId = 0;
	}

	async init() {
		if (this.worker) return;

		this.worker = new Worker(new URL(this.workerUrl, window.location.origin));

		this.worker.onmessage = (e) => {
			const { requestId, result, error } = e.data;
			const entry = this.pending.get(requestId);
			if (!entry) return;

			error ? entry.reject(new Error(error)) : entry.resolve(result);
			this.pending.delete(requestId);
		};

		this.worker.onerror = (err) => {
			console.error('[AuthCryptoService] Worker error:', err);
			for (const { reject } of this.pending.values()) {
				reject(new Error('CryptoWorker crashed'));
			}
			this.pending.clear();
		};
	}

	async request(method, params = {}) {
		await this.init();

		const id = this.requestId++;

		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });

			this.worker.postMessage({
				requestId: id,
				method,
				params,
			});

			setTimeout(() => {
				if (this.pending.has(id)) {
					this.pending.delete(id);
					reject(new Error(`Crypto timeout: ${method}`));
				}
			}, 30_000);
		});
	}

	// Методы, используемые в auth
	generateIdentity() {
		return this.request('generateIdentity');
	}

	async destroy() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}

export const authFeature = {
	id: 'auth',
	name: 'Authentication',
	version: '1.0.0',

	// ✅ Теперь зависим ТОЛЬКО от persistence
	dependencies: ['persistence'],

	ui: {
		screen: 'auth-screen',
		profile: 'profile-screen',
	},

	async onMount(mountContext) {
		console.log('🔐 Mounting Auth feature...');

		// Получаем persistence
		const persistenceResult =
			mountContext.featureRegistry.getMountResult('persistence');

		if (!persistenceResult?.service) {
			throw new Error('Persistence service not available');
		}

		const storage = persistenceResult.service;

		// ✅ Создаём СВОЙ crypto service
		const cryptoService = new AuthCryptoService();
		await cryptoService.init();

		// Создаём сервисы
		const authService = new AuthService(cryptoService);
		const authRepo = new AuthRepository(storage);

		// Создаём машину
		const machine = createAuthMachine({
			authService,
			authRepo,
			cryptoService,
		});

		const actor = createActor(machine, {
			inspect: (event) => {
				if (event.type === '@xstate.snapshot') {
					console.log('🔐 Auth state:', event.snapshot.value);
				}
			},
		});

		actor.start();

		console.log('✅ Auth feature mounted');

		return {
			actor,
			authService,
			authRepo,
			cryptoService, // ✅ Экспортируем для других фич, если нужно

			// Хелперы
			isAuthenticated: () => actor.getSnapshot().matches('authenticated'),

			getUser: () => {
				const snapshot = actor.getSnapshot();
				if (snapshot.matches('authenticated')) {
					return {
						username: snapshot.context.username,
						identity: snapshot.context.identity,
					};
				}
				return null;
			},

			waitForAuth: () =>
				new Promise((resolve, reject) => {
					const check = () => {
						const snapshot = actor.getSnapshot();
						if (snapshot.matches('authenticated')) {
							resolve(snapshot.context);
						}
					};

					check();

					const sub = actor.subscribe((snapshot) => {
						if (snapshot.matches('authenticated')) {
							sub.unsubscribe();
							resolve(snapshot.context);
						}
					});
				}),
		};
	},

	async onUnmount(context) {
		const { actor, cryptoService } = context;

		// При размонтировании — логаут
		if (actor.getSnapshot().matches('authenticated')) {
			actor.send({ type: 'LOGOUT' });
		}

		actor.stop();

		// ✅ Уничтожаем воркер
		if (cryptoService) {
			await cryptoService.destroy();
		}

		console.log('🔐 Auth feature unmounted');
	},
};
