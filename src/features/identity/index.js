// src/features/identity/index.js
import { createIdentityMachine } from './identity.machine.js';
import { IdentityCryptoService } from './identity.service.js';
import { IdentityRepository } from './identity.repository.js';
import { createActor } from 'xstate';

export const identityFeature = {
	id: 'identity',
	name: 'Identity',
	dependencies: ['persistence'],

	ui: {
		diagnostics: 'identity-diagnostics',
	},

	async onMount(mountContext) {
		const persistenceResult =
			mountContext.featureRegistry.getMountResult('persistence');

		if (!persistenceResult?.service) {
			throw new Error('Persistence not mounted or service not exposed');
		}

		// Инициализируем зависимости
		const repo = new IdentityRepository(persistenceResult.service);
		const crypto = new IdentityCryptoService('/workers/crypto.worker.js');

		// ⭐ Ждём инициализации crypto worker!
		await crypto.init();
		console.log('🔐 Crypto worker initialized');

		// Создаём и запускаем машину
		const machine = createIdentityMachine({ repo, crypto });
		const actor = createActor(machine, {
			inspect: (event) => {
				// Опционально: логирование всех переходов
				if (event.type === '@xstate.snapshot') {
					console.log('📍 Identity state:', event.snapshot.value);
				}
			},
		});

		actor.start();

		return {
			actor,
			crypto,
			repo,

			// Хелпер для ожидания готовности
			waitForReady: () =>
				new Promise((resolve, reject) => {
					const checkState = () => {
						const state = actor.getSnapshot();
						if (state.matches('ready')) {
							resolve(state.context);
						} else if (state.matches('error')) {
							reject(new Error(state.context.error));
						}
					};

					// Проверяем сразу
					checkState();

					// Подписываемся на изменения
					const sub = actor.subscribe((state) => {
						if (state.matches('ready')) {
							sub.unsubscribe();
							resolve(state.context);
						} else if (state.matches('error')) {
							sub.unsubscribe();
							reject(new Error(state.context.error));
						}
					});
				}),
		};
	},
};
