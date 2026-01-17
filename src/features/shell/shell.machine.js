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
			navigateToMessages: assign({
				currentScreen: 'messages',
				activeContactId: null,
			}),

			navigateToContacts: assign({
				currentScreen: 'contacts',
				activeContactId: null,
			}),

			navigateToJournal: assign({
				currentScreen: 'journal',
				activeContactId: null,
			}),

			navigateToDiscovery: assign({
				currentScreen: 'discovery',
				activeContactId: null,
			}),

			navigateToSettings: assign({
				currentScreen: 'settings',
				activeContactId: null,
			}),

			navigateToProfile: assign({
				currentScreen: 'profile',
				activeContactId: null,
			}),

			navigateToFiles: assign({
				currentScreen: 'files',
				activeContactId: null,
			}),

			navigateToChat: assign(({ event }) => ({
				currentScreen: 'chat',
				activeContactId: event.contactId || null,
			})),

			clearActiveContact: assign({
				activeContactId: null,
				currentScreen: 'contacts',
			}),

			// Auth tracking
			updateAuthState: assign(({ event }) => ({
				isAuthenticated: event.isAuthenticated,
				username: event.username,
			})),

			logScreenChange: ({ context }) => {
				console.log('📱 Screen changed:', context.currentScreen, {
					activeContact: context.activeContactId?.slice(0, 16) || null,
				});
			},
		},

		guards: {
			isAuthenticated: ({ context }) => context.isAuthenticated,
			isNotAuthenticated: ({ event }) => !event.isAuthenticated,
			eventIsAuthenticated: ({ event }) => event.isAuthenticated,
		},
	}).createMachine({
		id: 'shell',
		initial: 'loading',

		context: {
			// Зависимости
			authActor,

			// Состояние навигации
			currentScreen: 'messages', // по умолчанию показываем сообщения
			activeContactId: null,

			// Auth состояние (копия из authActor)
			isAuthenticated: false,
			username: null,
		},

		states: {
			loading: {
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
				on: {
					AUTH_STATE_CHANGED: {
						actions: 'updateAuthState',
						target: 'authenticated',
						guard: 'eventIsAuthenticated',
					},
				},
			},

			authenticated: {
				initial: 'idle',

				// Глобальные события для authenticated состояния
				on: {
					AUTH_STATE_CHANGED: [
						{
							actions: 'updateAuthState',
							target: 'guest',
							guard: 'isNotAuthenticated',
						},
						{
							actions: 'updateAuthState',
						},
					],

					// Навигация
					NAVIGATE_TO_MESSAGES: {
						actions: ['navigateToMessages', 'logScreenChange'],
					},

					NAVIGATE_TO_CONTACTS: {
						actions: ['navigateToContacts', 'logScreenChange'],
					},

					NAVIGATE_TO_JOURNAL: {
						actions: ['navigateToJournal', 'logScreenChange'],
					},

					NAVIGATE_TO_DISCOVERY: {
						actions: ['navigateToDiscovery', 'logScreenChange'],
					},

					NAVIGATE_TO_SETTINGS: {
						actions: ['navigateToSettings', 'logScreenChange'],
					},

					NAVIGATE_TO_PROFILE: {
						actions: ['navigateToProfile', 'logScreenChange'],
					},

					NAVIGATE_TO_FILES: {
						actions: ['navigateToFiles', 'logScreenChange'],
					},

					NAVIGATE_TO_CHAT: {
						actions: ['navigateToChat', 'logScreenChange'],
					},

					OPEN_CHAT: {
						actions: ['navigateToChat', 'logScreenChange'],
					},

					CLOSE_CHAT: {
						actions: ['clearActiveContact', 'logScreenChange'],
					},
				},

				states: {
					idle: {
						// Маркерное состояние
						// Вся логика навигации обрабатывается через context
					},
				},
			},
		},
	});
}
