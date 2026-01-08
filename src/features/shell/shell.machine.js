// src/features/shell/shell.machine.js

import { setup, assign } from 'xstate';

export function createShellMachine({ authActor }) {
	return setup({
		types: {
			context: {},
			events: {},
		},

		actions: {
			// Навигация
			navigateToSettings: assign({
				currentScreen: 'settings',
				activeContactId: null,
			}),

			navigateToContacts: assign({
				currentScreen: 'contactsList',
				activeContactId: null,
			}),

			navigateToChat: assign(({ event }) => ({
				currentScreen: 'chat',
				activeContactId: event.contactId,
			})),

			clearActiveContact: assign({
				activeContactId: null,
			}),

			// Auth tracking
			updateAuthState: assign(({ event }) => ({
				isAuthenticated: event.isAuthenticated,
				username: event.username,
			})),

			logScreenChange: ({ context }) => {
				console.log('📱 Screen changed:', context.currentScreen, {
					activeContact: context.activeContactId,
				});
			},
		},

		guards: {
			isAuthenticated: ({ context }) => context.isAuthenticated,
		},
	}).createMachine({
		id: 'shell',
		initial: 'loading',

		context: {
			// Зависимости
			authActor,

			// Состояние навигации
			currentScreen: 'settings', // 'settings' | 'contactsList' | 'chat'
			activeContactId: null,

			// Auth состояние (копия из authActor)
			isAuthenticated: false,
			username: null,
		},

		states: {
			loading: {
				// Ждём пока auth инициализируется
				always: [
					{
						guard: 'isAuthenticated',
						target: 'authenticated',
					},
					{
						target: 'guest',
					},
				],
			},

			guest: {
				// Пользователь не залогинен - показываем auth screen
				// Shell UI сам решит что показать
				on: {
					AUTH_STATE_CHANGED: {
						actions: 'updateAuthState',
						target: 'authenticated',
						guard: ({ event }) => event.isAuthenticated,
					},
				},
			},

			authenticated: {
				// Пользователь залогинен - показываем app
				initial: 'settings',

				on: {
					AUTH_STATE_CHANGED: [
						{
							actions: 'updateAuthState',
							target: 'guest',
							guard: ({ event }) => !event.isAuthenticated,
						},
						{
							actions: 'updateAuthState',
						},
					],
				},

				states: {
					settings: {
						entry: ['navigateToSettings', 'logScreenChange'],
						on: {
							NAVIGATE_TO_CONTACTS: 'contactsList',
						},
					},

					contactsList: {
						entry: ['navigateToContacts', 'logScreenChange'],
						on: {
							NAVIGATE_TO_SETTINGS: 'settings',
							OPEN_CHAT: {
								target: 'chat',
								actions: 'navigateToChat',
							},
						},
					},

					chat: {
						entry: 'logScreenChange',
						on: {
							NAVIGATE_TO_SETTINGS: {
								target: 'settings',
								actions: 'clearActiveContact',
							},
							NAVIGATE_TO_CONTACTS: {
								target: 'contactsList',
								actions: 'clearActiveContact',
							},
							OPEN_CHAT: {
								target: 'chat',
								actions: 'navigateToChat',
								reenter: true,
							},
						},
					},
				},
			},
		},
	});
}
