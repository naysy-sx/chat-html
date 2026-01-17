// src/features/signaling/signaling.machine.js

import { setup, assign, fromPromise, fromCallback } from 'xstate';

/**
 * Signaling Machine — управляет соединением с сигнальным сервером
 *
 * Состояния:
 * - idle: ожидание (не подключен)
 * - connecting: регистрация на сервере
 * - connected: активное соединение
 *   - polling: long polling для событий
 *   - heartbeat: периодический heartbeat
 * - reconnecting: переподключение после ошибки
 * - error: критическая ошибка
 */
export function createSignalingMachine({
	service,
	identity,
	profile,
	eventBus,
}) {
	// Извлекаем данные из identity
	// identity это объект { userId, identity, exchange, version }
	const userId = identity?.userId;

	// Публичный ключ для обмена (ECDH) — отправляем контактам
	const exchangePublicKey = identity?.exchange?.publicKey
		? JSON.stringify(identity.exchange.publicKey)
		: null;

	console.log('🔐 createSignalingMachine:', {
		userId: userId?.slice(0, 16) + '...',
		hasExchangeKey: !!exchangePublicKey,
		fullIdentity: identity,
	});

	return setup({
		actors: {
			// Регистрация на сервере
			register: fromPromise(async ({ input }) => {
				const { service, userId, exchangePublicKey } = input;

				if (!userId) {
					throw new Error('Missing userId');
				}

				if (!exchangePublicKey) {
					throw new Error('Missing exchange public key');
				}

				await service.register(userId, exchangePublicKey);
				console.log(
					'✅ Registered on signaling server:',
					userId.slice(0, 16) + '...'
				);
				return { success: true };
			}),

			// Long polling
			pollEvents: fromCallback(({ input, sendBack }) => {
				const { service, userId } = input;
				let isActive = true;
				let abortController = null;
				let consecutiveErrors = 0;

				const poll = async () => {
					while (isActive) {
						try {
							abortController = new AbortController();

							const events = await service.poll(userId, abortController.signal);
							consecutiveErrors = 0; // Сброс счётчика ошибок при успехе

							if (events.length > 0) {
								console.log(`📨 Received ${events.length} events`);
								sendBack({ type: 'EVENTS_RECEIVED', events });
							}
						} catch (error) {
							if (error.name === 'AbortError') {
								// Нормальная отмена
								continue;
							}

							if (isActive) {
								consecutiveErrors++;
								console.error(
									`❌ Poll error (${consecutiveErrors}):`,
									error.message
								);

								// После 3 ошибок подряд — уведомляем machine
								if (consecutiveErrors >= 3) {
									sendBack({ type: 'POLL_ERROR', error: error.message });
									break;
								}

								// Пауза перед повторной попыткой (exponential backoff)
								await sleep(
									Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 8000)
								);
							}
						}
					}
				};

				poll();

				return () => {
					isActive = false;
					abortController?.abort();
				};
			}),

			// Heartbeat каждые 30 секунд
			heartbeat: fromCallback(({ input, sendBack }) => {
				const { service, userId } = input;
				let failCount = 0;

				const sendHeartbeat = async () => {
					try {
						await service.heartbeat(userId);
						failCount = 0;
					} catch (error) {
						failCount++;
						console.warn(`⚠️ Heartbeat failed (${failCount}):`, error.message);

						if (failCount >= 3) {
							sendBack({ type: 'HEARTBEAT_FAILED', error: error.message });
						}
					}
				};

				// Сразу отправляем первый heartbeat
				sendHeartbeat();

				const interval = setInterval(sendHeartbeat, 30000);

				return () => clearInterval(interval);
			}),
		},

		actions: {
			// Обработка входящих событий
			processEvents: ({ context, event }) => {
				const events = event.events || [];

				for (const evt of events) {
					console.log(
						'📩 Processing event:',
						evt.type,
						'from:',
						evt.from?.slice(0, 16) + '...'
					);

					// Маппинг событий сервера на события EventBus
					const eventMapping = {
						invite: 'SIGNALING_INVITE_RECEIVED',
						invite_accepted: 'SIGNALING_INVITE_ACCEPTED',
						invite_rejected: 'SIGNALING_INVITE_REJECTED',
						message: 'SIGNALING_MESSAGE_RECEIVED',
						contact_deleted: 'SIGNALING_CONTACT_DELETED',
						contact_blocked: 'SIGNALING_CONTACT_BLOCKED',
						profile_updated: 'SIGNALING_PROFILE_UPDATED',
					};

					const busEventType =
						eventMapping[evt.type] || `SIGNALING_${evt.type.toUpperCase()}`;

					context.eventBus?.dispatch({
						type: busEventType,
						payload: evt,
					});
				}
			},

			assignError: assign({
				error: ({ event }) => event.error || 'Unknown error',
			}),

			clearError: assign({
				error: null,
			}),

			resetRetryCount: assign({
				retryCount: 0,
			}),

			incrementRetryCount: assign({
				retryCount: ({ context }) => context.retryCount + 1,
			}),

			logConnected: ({ context }) => {
				console.log(
					'🔗 Signaling connected:',
					context.userId?.slice(0, 16) + '...'
				);
			},

			logDisconnected: () => {
				console.log('🔌 Signaling disconnected');
			},

			notifyConnected: ({ context }) => {
				context.eventBus?.dispatch({
					type: 'SIGNALING_CONNECTED',
					userId: context.userId,
				});
			},

			notifyDisconnected: ({ context }) => {
				context.eventBus?.dispatch({
					type: 'SIGNALING_DISCONNECTED',
				});
			},

			// Отправка invite
			sendInvite: ({ context, event }) => {
				const { toUserId } = event;
				// Prefer profile passed with the event (e.g. from ContactsService),
				// otherwise fallback to actor context.profile
				const usedProfile = event.profile || context.profile;

				context.service
					.sendInvite(
						context.userId,
						usedProfile?.displayName || usedProfile?.username || 'User',
						toUserId,
						context.exchangePublicKey,
						usedProfile // pass the profile payload if available
					)
					.then(() => {
						console.log('✅ Invite sent to:', toUserId.slice(0, 16) + '...');
						context.eventBus?.dispatch({
							type: 'SIGNALING_INVITE_SENT',
							toUserId,
						});
					})
					.catch((err) => {
						console.error('❌ Failed to send invite:', err);
						context.eventBus?.dispatch({
							type: 'SIGNALING_INVITE_FAILED',
							toUserId,
							error: err.message,
						});
					});
			},

			// Принять invite
			acceptInvite: ({ context, event }) => {
				const { toUserId } = event;
				const usedProfile = event.profile || context.profile;

				context.service
					.acceptInvite(
						context.userId,
						usedProfile?.displayName || usedProfile?.username || 'User',
						toUserId,
						context.exchangePublicKey,
						usedProfile // pass profile if available
					)
					.then(() => {
						console.log(
							'✅ Invite accepted for:',
							toUserId.slice(0, 16) + '...'
						);
					})
					.catch((err) => {
						console.error('❌ Failed to accept invite:', err);
					});
			},
			blockContact: ({ context, event }) => {
				const { toUserId } = event;

				context.service
					.blockContact(context.userId, toUserId)
					.then(() => {
						console.log('🚫 Contact blocked:', toUserId.slice(0, 16) + '...');
					})
					.catch((err) => {
						console.error('❌ Failed to block contact:', err);
					});
			},
			// Отклонить invite
			rejectInvite: ({ context, event }) => {
				const { toUserId } = event;
				const usedProfile = event.profile || context.profile;

				context.service
					.rejectInvite(
						context.userId,
						usedProfile?.displayName || usedProfile?.username || 'User',
						toUserId
					)
					.then(() => {
						console.log(
							'✅ Invite rejected for:',
							toUserId.slice(0, 16) + '...'
						);
					})
					.catch((err) => {
						console.error('❌ Failed to reject invite:', err);
					});
			},

			// Отправить сообщение
			sendMessage: ({ context, event }) => {
				const { toUserId, messageData } = event;

				context.service
					.sendMessage(context.userId, toUserId, messageData)
					.catch((err) => {
						console.error('❌ Failed to send message:', err);
						context.eventBus?.dispatch({
							type: 'SIGNALING_MESSAGE_FAILED',
							toUserId,
							error: err.message,
						});
					});
			},

			// Отправить профиль контакту
			sendProfile: ({ context, event }) => {
				const { toUserId, profile } = event;

				context.service
					.sendProfile(context.userId, toUserId, profile || context.profile)
					.catch((err) => {
						console.error('❌ Failed to send profile:', err);
					});
			},

			// Отправить профиль всем контактам
			broadcastProfile: ({ context, event }) => {
				const { contactIds, profile } = event;

				if (!contactIds || contactIds.length === 0) {
					console.log('📢 No contacts to broadcast profile to');
					return;
				}

				const usedProfile = profile || context.profile;

				context.service
					.broadcastProfile(context.userId, contactIds, usedProfile)
					.then(() => {
						console.log(
							`✅ Profile broadcasted to ${contactIds.length} contacts`
						);
						context.eventBus?.dispatch({
							type: 'SIGNALING_PROFILE_BROADCASTED',
							count: contactIds.length,
						});
					})
					.catch((err) => {
						console.error('❌ Failed to broadcast profile:', err);
					});
			},

			// Уведомить об удалении контакта
			notifyContactDeleted: ({ context, event }) => {
				const { toUserId } = event;

				context.service
					.sendContactDeleted(context.userId, toUserId)
					.catch((err) => {
						console.error('❌ Failed to notify contact deleted:', err);
					});
			},

			// Обновить профиль в контексте
			updateProfile: assign({
				profile: ({ event }) => event.profile,
			}),

			// Обновить сервис (при смене сервера)
			updateService: assign({
				service: ({ event }) => event.service,
			}),
		},

		guards: {
			canRetry: ({ context }) => context.retryCount < 5,
			hasIdentity: ({ context }) => {
				const ok = !!context.userId && !!context.exchangePublicKey;
				console.log('🔐 Guard hasIdentity:', {
					userId: !!context.userId,
					exchangePublicKey: !!context.exchangePublicKey,
					result: ok,
				});
				return ok;
			},
		},

		delays: {
			RETRY_DELAY: ({ context }) => {
				// Exponential backoff: 1s, 2s, 4s, 8s, 16s
				return Math.min(1000 * Math.pow(2, context.retryCount), 16000);
			},
		},
	}).createMachine({
		id: 'signaling',
		initial: 'idle',

		context: {
			service,
			eventBus,
			userId,
			exchangePublicKey,
			profile,
			error: null,
			retryCount: 0,
		},

		states: {
			idle: {
				entry: () => {
					console.log('📡 Machine: entering idle state');
				},
				on: {
					CONNECT: {
						target: 'connecting',
						guard: 'hasIdentity',
					},
				},
			},

			connecting: {
				entry: [
					'clearError',
					() => {
						console.log(
							'📡 Machine: entering connecting state, registering...'
						);
					},
				],
				invoke: {
					src: 'register',
					input: ({ context }) => ({
						service: context.service,
						userId: context.userId,
						exchangePublicKey: context.exchangePublicKey,
					}),
					onDone: {
						target: 'connected',
						actions: ['resetRetryCount', 'logConnected', 'notifyConnected'],
					},
					onError: {
						target: 'reconnecting',
						actions: 'assignError',
					},
				},
			},

			connected: {
				entry: () => console.log('📡 Machine: entering connected state'),
				type: 'parallel',

				states: {
					polling: {
						invoke: {
							src: 'pollEvents',
							input: ({ context }) => ({
								service: context.service,
								userId: context.userId,
							}),
						},
						on: {
							EVENTS_RECEIVED: {
								actions: 'processEvents',
							},
							POLL_ERROR: {
								target: '#signaling.reconnecting',
								actions: 'assignError',
							},
						},
					},

					heartbeat: {
						invoke: {
							src: 'heartbeat',
							input: ({ context }) => ({
								service: context.service,
								userId: context.userId,
							}),
						},
						on: {
							HEARTBEAT_FAILED: {
								target: '#signaling.reconnecting',
								actions: 'assignError',
							},
						},
					},
				},

				on: {
					DISCONNECT: {
						target: 'idle',
						actions: ['logDisconnected', 'notifyDisconnected'],
					},

					// Команды для отправки
					SEND_INVITE: { actions: 'sendInvite' },
					ACCEPT_INVITE: { actions: 'acceptInvite' },
					REJECT_INVITE: { actions: 'rejectInvite' },
					SEND_MESSAGE: { actions: 'sendMessage' },
					SEND_PROFILE: { actions: 'sendProfile' },
					BROADCAST_PROFILE: { actions: 'broadcastProfile' },
					CONTACT_DELETED: { actions: 'notifyContactDeleted' },
					BLOCK_CONTACT: { actions: 'blockContact' },
					UPDATE_PROFILE: { actions: 'updateProfile' },

					// Смена сервера — отключаемся, обновляем сервис
					CHANGE_SERVER: {
						target: 'idle',
						actions: ['logDisconnected', 'notifyDisconnected', 'updateService'],
					},
				},
			},

			reconnecting: {
				entry: 'incrementRetryCount',
				after: {
					RETRY_DELAY: [
						{
							target: 'connecting',
							guard: 'canRetry',
						},
						{
							target: 'error',
						},
					],
				},
				on: {
					DISCONNECT: {
						target: 'idle',
						actions: ['logDisconnected', 'notifyDisconnected'],
					},
				},
			},

			error: {
				entry: ({ context }) => {
					console.error('❌ Signaling error after max retries:', context.error);
					context.eventBus?.dispatch({
						type: 'SIGNALING_ERROR',
						error: context.error,
					});
				},
				on: {
					RETRY: {
						target: 'connecting',
						actions: 'resetRetryCount',
					},
					DISCONNECT: {
						target: 'idle',
					},
				},
			},
		},
	});
}

// Helper
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
