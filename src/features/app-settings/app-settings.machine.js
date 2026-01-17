// src/features/app-settings/app-settings.machine.js

import { setup, assign, fromPromise } from 'xstate';

export function createAppSettingsMachine({
	repo,
	service,
	username,
	eventBus,
}) {
	return setup({
		actors: {
			loadSettings: fromPromise(async ({ input }) => {
				const saved = await input.repo.getSettings(input.username);

				if (!saved) {
					return input.service.getDefaultSettings();
				}

				return saved;
			}),

			saveSettings: fromPromise(async ({ input }) => {
				const { settings, repo, username, eventBus } = input;

				const validation = input.service.validateNavigationItems(
					settings.navigation.items
				);

				if (!validation.valid) {
					throw new Error(validation.error);
				}

				await repo.saveSettings(username, settings);

				if (eventBus) {
					eventBus.dispatch(
						{
							type: 'APP_SETTINGS_UPDATED',
							settings,
						},
						'HIGH'
					);
				}

				return settings;
			}),
		},

		actions: {
			assignSettings: assign(({ event }) => ({
				settings: event.output,
				error: null,
			})),
			// ✅ ИСПРАВЛЕНИЕ: Это побочный эффект, assign здесь не нужен.
			// Просто выполняем функцию.
			applyThemeEffect: ({ context, event }) => {
				// Пытаемся взять настройки из контекста или из event.output (если только загрузили)
				const settings = event.output || context.settings;

				if (settings && settings.design) {
					applyTheme(settings.design);
				}
			},

			updateNavigationItems: assign(({ context, event }) => ({
				settings: {
					...context.settings,
					navigation: {
						items: event.items,
					},
				},
			})),

			// ✅ НОВЫЙ ACTION: Для обновления настроек дизайна из UI
			updateDesignSettings: assign(({ context, event }) => ({
				settings: {
					...context.settings,
					design: event.design,
				},
			})),
			updateNavigationItems: assign(({ context, event }) => ({
				settings: {
					...context.settings,
					navigation: {
						items: event.items,
					},
				},
			})),

			toggleItemVisibility: assign(({ context, event }) => {
				const items = context.settings.navigation.items.map((item) =>
					item.id === event.itemId ? { ...item, visible: !item.visible } : item
				);

				return {
					settings: {
						...context.settings,
						navigation: { items },
					},
				};
			}),

			// Action для перестановки элементов
			reorderNavigationItems: assign(({ context, event }) => {
				const { fromIndex, toIndex } = event;
				const items = [...context.settings.navigation.items];

				// Извлекаем элемент
				const [movedItem] = items.splice(fromIndex, 1);
				// Вставляем на новую позицию
				items.splice(toIndex, 0, movedItem);

				// ✅ Пересчитываем order для всех элементов
				const reorderedItems = items.map((item, index) => ({
					...item,
					order: index,
				}));

				return {
					settings: {
						...context.settings,
						navigation: { items: reorderedItems },
					},
				};
			}),

			resetToDefaults: assign(({ context }) => ({
				settings: context.service.getDefaultSettings(),
			})),

			assignError: assign({
				error: ({ event }) => event.error?.message || 'Неизвестная ошибка',
			}),

			clearError: assign({
				error: null,
			}),

			logSaved: () => {
				console.log('✅ App settings saved');
			},
		},
	}).createMachine({
		id: 'appSettings',
		initial: 'loading',

		context: {
			repo,
			service,
			username,
			eventBus,
			settings: service.getDefaultSettings(),
			error: null,
		},

		states: {
			loading: {
				invoke: {
					src: 'loadSettings',
					input: ({ context }) => ({
						repo: context.repo,
						service: context.service,
						username: context.username,
					}),
					onDone: {
						target: 'ready',
						actions: ['assignSettings', 'applyThemeEffect'],
					},
					onError: {
						target: 'error',
						actions: 'assignError',
					},
				},
			},

			ready: {
				on: {
					UPDATE_NAVIGATION_ITEMS: {
						actions: ['updateNavigationItems', 'clearError'],
					},
					UPDATE_DESIGN_SETTINGS: {
						actions: ['updateDesignSettings', 'clearError'],
					},
					TOGGLE_ITEM_VISIBILITY: {
						actions: ['toggleItemVisibility', 'clearError'],
					},
					REORDER_NAVIGATION_ITEMS: {
						actions: ['reorderNavigationItems', 'clearError'],
					},
					SAVE_SETTINGS: {
						target: 'saving',
					},
					RESET_TO_DEFAULTS: {
						actions: ['resetToDefaults', 'clearError'],
						target: 'saving',
					},
				},
			},

			saving: {
				invoke: {
					src: 'saveSettings',
					input: ({ context }) => ({
						settings: context.settings,
						repo: context.repo,
						service: context.service,
						username: context.username,
						eventBus: context.eventBus,
					}),
					onDone: {
						target: 'ready',
						actions: ['assignSettings', 'logSaved'],
					},
					onError: {
						target: 'ready',
						actions: 'assignError',
					},
				},
			},

			error: {
				on: {
					RETRY: {
						target: 'loading',
						actions: 'clearError',
					},
				},
			},
		},
	});
}
