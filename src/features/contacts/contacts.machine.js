// src/features/contacts/contacts.machine.js

import { setup, assign, fromPromise } from 'xstate';

export function createContactsMachine({ service, eventBus }) {
	return setup({
		types: {
			context: {},
			events: {},
		},

		actors: {
			// Загрузить контакты из хранилища
			loadContacts: fromPromise(async ({ input }) => {
				const { service } = input;
				console.log('📊 loadContacts actor: starting load...');
				const result = await service.loadContacts();
				let contacts = [];
				if (Array.isArray(result)) contacts = result;
				else if (result && Array.isArray(result.contacts))
					contacts = result.contacts;

				console.log(
					'📊 loadContacts actor: loaded',
					contacts.length,
					'contacts from DB'
				);

				// ✅ ДОБАВЛЕНО: Загружаем группы вместе с контактами
				const groups = await service.getGroups();
				console.log('📊 loadContacts actor: loaded', groups.length, 'groups');

				return { contacts, groups };
			}),

			// Добавить новый контакт
			addContact: fromPromise(async ({ input }) => {
				const { service, data } = input;
				const contact = await service.addContact(data);
				return { contact };
			}),

			// Принять входящее приглашение
			acceptContact: fromPromise(async ({ input }) => {
				const { service, contactId, group } = input;
				const contact = await service.acceptContact(contactId, group);
				// ✅ Возвращаем обновлённые группы
				const groups = await service.getGroups();
				return { contact, groups };
			}),

			// Отклонить входящее приглашение
			rejectContact: fromPromise(async ({ input }) => {
				const { service, contactId } = input;
				await service.rejectContact(contactId);
				return { contactId };
			}),

			// Отменить исходящий запрос
			cancelOutgoing: fromPromise(async ({ input }) => {
				const { service, contactId } = input;
				await service.cancelOutgoing(contactId);
				return { contactId };
			}),

			// Удалить контакт
			deleteContact: fromPromise(async ({ input }) => {
				const { service, contactId } = input;
				await service.deleteContact(contactId);
				const groups = await service.getGroups();
				return { contactId, groups };
			}),

			// ✅ ДОБАВЛЕНО: Удалить и заблокировать контакт
			deleteAndBlockContact: fromPromise(async ({ input }) => {
				const { service, contactId } = input;
				await service.deleteAndBlockContact(contactId);
				const groups = await service.getGroups();
				return { contactId, groups };
			}),

			// Обновить группу контакта
			updateGroup: fromPromise(async ({ input }) => {
				const { service, contactId, group } = input;
				const contact = await service.updateContactGroup(contactId, group);
				const groups = await service.getGroups();
				return { contact, groups };
			}),
		},

		actions: {
			// ✅ ИЗМЕНЕНО: Обновить контакты И группы в контексте
			assignContacts: assign({
				contacts: ({ event }) => {
					const out = event?.output;
					let result = [];
					if (Array.isArray(out)) result = out;
					else if (out && Array.isArray(out.contacts)) result = out.contacts;

					console.log(
						'📇 assignContacts action: assigning',
						result.length,
						'contacts'
					);
					return result;
				},
				groups: ({ event }) => {
					const out = event?.output;
					const result =
						out && Array.isArray(out.groups) ? out.groups : ['Default'];
					console.log(
						'📇 assignContacts action: assigning',
						result.length,
						'groups'
					);
					return result;
				},
			}),

			// Добавить контакт в список
			addContactToList: assign({
				contacts: ({ context, event }) => {
					const newContact = event?.output?.contact;
					const base = Array.isArray(context.contacts) ? context.contacts : [];
					return [...base, newContact].filter(Boolean);
				},
			}),

			// ✅ ИЗМЕНЕНО: Обновить контакт и группы
			updateContactInList: assign({
				contacts: ({ context, event }) => {
					const updated = event?.output?.contact;
					const base = Array.isArray(context.contacts) ? context.contacts : [];
					if (!updated) return base;
					return base.map((c) => (c.id === updated.id ? updated : c));
				},
				groups: ({ context, event }) => {
					const groups = event?.output?.groups;
					return groups || context.groups || ['Default'];
				},
			}),

			// ✅ ИЗМЕНЕНО: Удалить контакт и обновить группы
			removeContactFromList: assign({
				contacts: ({ context, event }) => {
					const contactId = event?.output?.contactId;
					const base = Array.isArray(context.contacts) ? context.contacts : [];
					if (!contactId) return base;
					return base.filter((c) => c.id !== contactId);
				},
				groups: ({ context, event }) => {
					const groups = event?.output?.groups;
					return groups || context.groups || ['Default'];
				},
			}),

			// Очистить активный контакт если удалён
			clearActiveContactIfDeleted: assign({
				activeContactId: ({ context, event }) => {
					const contactId = event?.output?.contactId;
					if (context.activeContactId === contactId) {
						return null;
					}
					return context.activeContactId;
				},
			}),

			// Установить активный контакт
			setActiveContact: assign({
				activeContactId: ({ event }) => event.contactId,
			}),

			// Очистить активный контакт
			clearActiveContact: assign({
				activeContactId: null,
			}),

			// Обработка ошибок
			assignError: assign({
				error: (args = {}) => {
					const ev = args.event || args;
					return ev?.error?.message || ev?.data?.message || 'Unknown error';
				},
			}),

			clearError: assign({
				error: null,
			}),

			// Логирование
			logLoaded: (args = {}) => {
				const context = args.context || {};
				console.log(
					'📇 Contacts loaded:',
					(context.contacts || []).length,
					'groups:',
					(context.groups || []).length
				);
			},

			logError: (args = {}) => {
				const context = args.context || {};
				console.error(
					'❌ Contacts error:',
					context.error || args.error || args.event?.error || 'Unknown'
				);
			},

			// Уведомления через EventBus
			notifyContactAdded: (args = {}) => {
				const context = args.context || {};
				const event = args.event || {};
				const contact = event.output?.contact;
				context.eventBus?.dispatch({
					type: 'CONTACTS_CONTACT_ADDED',
					contact,
				});
			},

			notifyContactUpdated: (args = {}) => {
				const context = args.context || {};
				const event = args.event || {};
				const contact = event.output?.contact;
				context.eventBus?.dispatch({
					type: 'CONTACTS_CONTACT_UPDATED',
					contact,
				});
			},

			notifyContactDeleted: (args = {}) => {
				const context = args.context || {};
				const event = args.event || {};
				const contactId = event.output?.contactId;
				context.eventBus?.dispatch({
					type: 'CONTACTS_CONTACT_DELETED',
					contactId,
				});
			},

			notifyContactsLoaded: (args = {}) => {
				const context = args.context || {};
				context.eventBus?.dispatch({
					type: 'CONTACTS_LOADED',
					contacts: context.contacts || [],
					groups: context.groups || [],
				});
			},

			// Обработка событий от signaling
			handleIncomingInvite: ({ context, event }) => {
				const payload = event.payload;

				console.log('📨 handleIncomingInvite called with:', {
					hasContext: !!context,
					hasService: !!context.service,
					payload,
				});

				if (!context.service) return;

				context.service
					.handleIncomingInvite(payload)
					.then(() => {
						console.log('📨 Invite processed, sending RELOAD to machine');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle incoming invite:', err);
					});
			},

			handleInviteAccepted: ({ context, event }) => {
				const payload = event.payload;
				if (!context.service) return;

				context.service
					.handleInviteAccepted(payload)
					.then(() => {
						console.log('📨 Invite accepted processed, sending RELOAD');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle invite accepted:', err);
					});
			},

			handleInviteRejected: ({ context, event }) => {
				const payload = event.payload;
				if (!context.service) return;

				context.service
					.handleInviteRejected(payload)
					.then(() => {
						console.log('📨 Invite rejected processed, sending RELOAD');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle invite rejected:', err);
					});
			},

			handleContactDeleted: ({ context, event }) => {
				const payload = event.payload;
				if (!context.service) return;

				context.service
					.handleContactDeleted(payload)
					.then(() => {
						console.log('📨 Contact deleted processed, sending RELOAD');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle contact deleted:', err);
					});
			},

			handleContactBlocked: ({ context, event }) => {
				const payload = event.payload;
				if (!context.service) return;

				context.service
					.handleContactBlocked(payload)
					.then(() => {
						console.log('🚫 Contact blocked processed, sending RELOAD');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle contact blocked:', err);
					});
			},

			handleProfileUpdated: ({ context, event }) => {
				const payload = event.payload;
				if (!context.service) return;

				context.service
					.handleProfileUpdate(payload)
					.then(() => {
						console.log('📨 Profile updated processed, sending RELOAD');
						context.eventBus?.dispatch({
							type: 'CONTACTS_RELOAD_REQUESTED',
						});
					})
					.catch((err) => {
						console.error('Failed to handle profile update:', err);
					});
			},
		},
	}).createMachine({
		id: 'contacts',
		initial: 'loading',

		context: {
			service,
			eventBus,
			contacts: [],
			groups: ['Default'], // ✅ Инициализируем с Default
			activeContactId: null,
			error: null,
		},

		states: {
			loading: {
				entry: ({ context }) => {
					console.log(
						'🔄 Contacts machine entering loading state, current contacts:',
						context.contacts?.length || 0
					);
				},
				invoke: {
					src: 'loadContacts',
					input: ({ context }) => ({ service: context.service }),
					onDone: {
						target: 'ready',
						actions: ['assignContacts', 'logLoaded', 'notifyContactsLoaded'],
					},
					onError: {
						target: 'error',
						actions: ['assignError', 'logError'],
					},
				},
			},

			ready: {
				entry: ({ context }) => {
					console.log(
						'✅ Contacts machine entered ready state with',
						context.contacts?.length || 0,
						'contacts'
					);
				},
				on: {
					ADD_CONTACT: {
						target: 'adding',
					},

					ACCEPT_CONTACT: {
						target: 'accepting',
					},

					REJECT_CONTACT: {
						target: 'rejecting',
					},

					CANCEL_OUTGOING: {
						target: 'cancelling',
					},

					DELETE_CONTACT: {
						target: 'deleting',
					},

					DELETE_AND_BLOCK_CONTACT: {
						target: 'blocking',
					},

					UPDATE_CONTACT_GROUP: {
						target: 'updatingGroup',
					},

					RELOAD: {
						target: 'loading',
					},

					SELECT_CONTACT: {
						actions: 'setActiveContact',
					},

					SIGNALING_INVITE_RECEIVED: {
						actions: 'handleIncomingInvite',
					},

					SIGNALING_INVITE_ACCEPTED: {
						actions: 'handleInviteAccepted',
					},

					SIGNALING_INVITE_REJECTED: {
						actions: 'handleInviteRejected',
					},

					SIGNALING_CONTACT_DELETED: {
						actions: 'handleContactDeleted',
					},

					SIGNALING_CONTACT_BLOCKED: {
						actions: 'handleContactBlocked',
					},

					SIGNALING_PROFILE_UPDATED: {
						actions: 'handleProfileUpdated',
					},
				},
			},

			adding: {
				invoke: {
					src: 'addContact',
					input: ({ context, event }) => ({
						service: context.service,
						data: event.data,
					}),
					onDone: {
						target: 'ready',
						actions: ['addContactToList', 'notifyContactAdded'],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			accepting: {
				invoke: {
					src: 'acceptContact',
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
						group: event.group,
					}),
					onDone: {
						target: 'ready',
						actions: ['updateContactInList', 'notifyContactUpdated'],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			rejecting: {
				invoke: {
					src: 'rejectContact',
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
					}),
					onDone: {
						target: 'ready',
						actions: ['removeContactFromList', 'notifyContactDeleted'],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			cancelling: {
				invoke: {
					src: 'cancelOutgoing',
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
					}),
					onDone: {
						target: 'ready',
						actions: ['removeContactFromList', 'notifyContactDeleted'],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			deleting: {
				invoke: {
					src: 'deleteContact',
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
					}),
					onDone: {
						target: 'ready',
						actions: [
							'removeContactFromList',
							'clearActiveContactIfDeleted',
							'notifyContactDeleted',
						],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			blocking: {
				invoke: {
					src: 'deleteAndBlockContact', // ✅ Теперь этот актор существует
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
					}),
					onDone: {
						target: 'ready',
						actions: [
							'removeContactFromList',
							'clearActiveContactIfDeleted',
							'notifyContactDeleted',
						],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
					},
				},
			},

			updatingGroup: {
				invoke: {
					src: 'updateGroup',
					input: ({ context, event }) => ({
						service: context.service,
						contactId: event.contactId,
						group: event.group,
					}),
					onDone: {
						target: 'ready',
						actions: ['updateContactInList', 'notifyContactUpdated'],
					},
					onError: {
						target: 'ready',
						actions: ['assignError', 'logError'],
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
