// src/features/identity/identity.machine.js
import { setup, assign, fromPromise } from 'xstate';

export function createIdentityMachine({ repo, crypto }) {
	return setup({
		actors: {
			loadIdentity: fromPromise(async ({ input }) => {
				console.log('🔍 loadIdentity: начало загрузки...');

				const stored = await input.repo.load();
				console.log('🔍 loadIdentity: результат:', stored);

				if (!stored) {
					throw new Error('Identity not found');
				}

				return stored;
			}),

			generateIdentity: fromPromise(async ({ input }) => {
				console.log('🔐 generateIdentity: генерация новой identity...');

				const raw = await input.crypto.generateIdentity();
				console.log(
					'🔐 generateIdentity: сгенерировано, userId:',
					raw.userId?.slice(0, 16) + '...'
				);

				const identity = {
					version: 2,
					userId: raw.userId,
					identity: raw.identity,
					exchange: raw.exchange,
					createdAt: Date.now(),
				};

				await input.repo.save(identity);
				console.log('🔐 generateIdentity: сохранено в хранилище');

				return identity;
			}),
		},

		actions: {
			assignIdentity: assign(({ event }) => {
				const data = event.output;
				return {
					userId: data.userId,
					identity: data.identity,
					exchange: data.exchange,
					version: data.version,
					createdAt: data.createdAt,
					error: null,
				};
			}),

			assignError: assign({
				error: ({ event }) => event.error?.message || 'Unknown error',
			}),

			logReady: ({ context }) => {
				console.log(
					'✅ Identity ready! userId:',
					context.userId?.slice(0, 16) + '...'
				);
			},

			logError: ({ context }) => {
				console.error('❌ Identity error:', context.error);
			},
		},
	}).createMachine({
		id: 'identity',
		initial: 'loading',

		context: {
			// Зависимости (не сериализуются)
			repo,
			crypto,
			// Данные identity
			userId: null,
			identity: null,
			exchange: null,
			version: null,
			createdAt: null,
			error: null,
		},

		states: {
			loading: {
				invoke: {
					src: 'loadIdentity',
					// ⭐ КЛЮЧЕВОЙ МОМЕНТ: передаём данные через input!
					input: ({ context }) => ({
						repo: context.repo,
					}),
					onDone: {
						target: 'ready',
						actions: 'assignIdentity',
					},
					onError: {
						target: 'generating',
						// Первый запуск — identity нет, это нормально
					},
				},
			},

			generating: {
				invoke: {
					src: 'generateIdentity',
					// ⭐ Передаём и repo и crypto
					input: ({ context }) => ({
						repo: context.repo,
						crypto: context.crypto,
					}),
					onDone: {
						target: 'ready',
						actions: 'assignIdentity',
					},
					onError: {
						target: 'error',
						actions: 'assignError',
					},
				},
			},

			ready: {
				entry: 'logReady',
				on: {
					REGENERATE: 'generating',
				},
			},

			error: {
				entry: 'logError',
				on: {
					RETRY: 'loading',
				},
			},
		},
	});
}
