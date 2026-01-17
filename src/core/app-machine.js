// App Machine (Root Orchestrator)
import { setup, assign, fromPromise } from 'xstate';
import { featureRegistry } from './feature-registry.js';

// Глобальный контекст для монтирования (устанавливается в bootstrap)
let mountContext = null;

export function setMountContext(context) {
	mountContext = context;
}

export const appMachine = setup({
	types: {
		context: {},
		events: {},
	},

	actors: {
		mountFeatures: fromPromise(async ({ input }) => {
			// Монтируем все зарегистрированные фичи
			// Используем mountContext из замыкания или input
			const context = mountContext || input;
			console.log('🎯 mountFeatures STARTED - using context:', context);
			if (!context || !context.actorRegistry) {
				throw new Error('Missing required context: actorRegistry');
			}
			try {
				console.log('🎯 mountFeatures: calling featureRegistry.mountAll');
				await featureRegistry.mountAll(context);
				console.log('🎯 mountFeatures SUCCESS!');
				return { success: true };
			} catch (err) {
				console.error('🎯 mountFeatures ERROR:', err);
				throw err;
			}
		}),

		unmountFeatures: fromPromise(async () => {
			await featureRegistry.unmountAll();
			return { success: true };
		}),

		detectStartupType: fromPromise(async () => {
			// Простая детекция типа старта
			const hasStoredSession = localStorage.getItem('session') !== null;
			const hasNetwork = navigator.onLine;

			if (!hasStoredSession) {
				return 'cold';
			}
			if (!hasNetwork) {
				return 'offline';
			}
			return 'warm';
		}),

		loadSettings: fromPromise(async () => {
			// Загружаем настройки из localStorage
			const settings = localStorage.getItem('settings');
			return settings ? JSON.parse(settings) : {};
		}),
	},
}).createMachine({
	id: 'app',

	initial: 'booting',

	context: {
		features: [],
		mountedFeatures: new Set(),
		startupType: 'cold',
		settings: {},
	},

	states: {
		booting: {
			initial: 'detecting',

			states: {
				detecting: {
					invoke: {
						src: 'detectStartupType',
						onDone: {
							target: 'loadingSettings',
							actions: assign({
								startupType: ({ event }) => event.output,
							}),
						},
					},
				},

				loadingSettings: {
					invoke: {
						src: 'loadSettings',
						onDone: {
							target: 'mounting',
							actions: assign({
								settings: ({ event }) => event.output,
							}),
						},
					},
				},

				mounting: {
					invoke: {
						src: 'mountFeatures',
						input: ({ self }) => {
							// Добавляем appActor в контекст
							if (mountContext) {
								mountContext.appActor = self;
							}
							return mountContext || {};
						},
						onDone: {
							target: '#app.ready',
							actions: [
								() => {
									console.log(
										'🎯 mountFeatures onDone - features mounted successfully!'
									);
								},
								assign({
									mountedFeatures: () =>
										new Set(featureRegistry.getAll().map((f) => f.id)),
								}),
							],
						},
						onError: {
							target: '#app.error',
							actions: ({ event }) => {
								console.error(
									'🎯 Mounting failed - onError triggered:',
									event.error
								);
							},
						},
					},
				},
			},
		},

		ready: {
			// Приложение работает
			on: {
				LOGOUT: {
					target: 'shuttingDown',
				},
				ERROR_CRITICAL: {
					target: 'error',
				},
			},
		},

		shuttingDown: {
			invoke: {
				src: 'unmountFeatures',
				onDone: {
					target: 'terminated',
				},
			},
		},

		error: {
			// Error boundary
			on: {
				RETRY: {
					target: 'booting',
				},
			},
		},

		terminated: {
			type: 'final',
		},
	},
});
