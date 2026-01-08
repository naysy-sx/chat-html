// src/features/settings/settings.machine.js

import { setup, assign, fromPromise } from 'xstate';

export function createSettingsMachine({
	repo,
	service,
	username,
	identity, // <--- Мы получаем identity при инициализации
	authService,
	authRepo,
	eventBus,
}) {
	return setup({
		actors: {
			loadProfile: fromPromise(async ({ input }) => {
				const profile = await input.repo.getProfile(input.username);

				if (!profile) {
					return {
						username: input.username,
						displayName: input.username,
						bio: '',
						avatar: null,
						showInDiscovery: false,
					};
				}

				return {
					...profile,
					showInDiscovery: profile?.showInDiscovery ?? false,
				};
			}),

			saveProfile: fromPromise(async ({ input }) => {
				const { profile, repo, service, eventBus, username } = input;

				const displayNameCheck = service.validateUsername(
					profile.displayName || profile.username
				);
				if (!displayNameCheck.valid) {
					throw new Error(displayNameCheck.error);
				}

				const bioCheck = service.validateBio(profile.bio);
				if (!bioCheck.valid) {
					throw new Error(bioCheck.error);
				}

				await repo.saveProfile(username, profile);

				if (eventBus) {
					eventBus.dispatch(
						{
							type: 'PROFILE_UPDATED',
							username,
							profile: { ...profile },
						},
						'HIGH'
					);
				}

				return profile;
			}),

			processAvatar: fromPromise(async ({ input }) => {
				const { file, service } = input;
				return service.processAvatar(file);
			}),

			loadServers: fromPromise(async ({ input }) => {
				const saved = await input.repo.getSignalingServers(input.username);

				if (!saved || saved.length === 0) {
					return input.service.getInitialServers();
				}

				return saved;
			}),

			saveServers: fromPromise(async ({ input }) => {
				await input.repo.saveSignalingServers(input.username, input.servers);
				return input.servers;
			}),

			changePassword: fromPromise(async ({ input }) => {
				const {
					oldPassword,
					newPassword,
					username,
					identity, // <--- Важно: берем identity из input
					authService,
					authRepo,
				} = input;

				console.log('🔐 Changing password for:', username);

				// 1. Валидация нового пароля
				const passwordCheck = authService.validatePassword(newPassword);
				if (!passwordCheck.valid) {
					throw new Error(passwordCheck.error);
				}

				// 2. Получаем пользователя из БД
				const user = await authRepo.getUser(username);
				if (!user) {
					throw new Error('Пользователь не найден');
				}

				// 3. Проверяем старый пароль
				const isValid = await authService.verifyPassword(
					oldPassword,
					user.passwordHash,
					user.salt
				);

				if (!isValid) {
					throw new Error('Неверный текущий пароль');
				}

				// 4. Генерируем новый хеш и соль
				const { hash, salt } = await authService.hashPassword(newPassword);

				// 5. ПЕРЕШИФРОВЫВАЕМ IDENTITY
				if (!identity) {
					throw new Error(
						'Критическая ошибка: Identity не загружена в контекст'
					);
				}

				// Шифруем identity новым паролем и новой солью
				const encryptedIdentity = await authService.encryptUserData(
					identity,
					newPassword,
					salt
				);

				// 6. Обновляем все данные в БД (транзакционно, по идее, но здесь последовательно)

				// Сначала сохраняем новую identity
				await authRepo.saveUserData(username, 'identity', encryptedIdentity);

				// Затем обновляем хеш пароля и соль пользователя
				await authRepo.updateUser(username, {
					passwordHash: hash,
					salt,
				});
				await authRepo.updateUser(username, {
					passwordHash: hash,
					salt,
				});

				// --- ДОБАВЛЯЕМ ПРОВЕРКУ ---
				const verifyUser = await authRepo.getUser(username);
				console.log('🔍 DB Verification:', {
					expectedHash: hash.substring(0, 10) + '...',
					savedHash: verifyUser.passwordHash.substring(0, 10) + '...',
					match: verifyUser.passwordHash === hash,
				});

				if (verifyUser.passwordHash !== hash) {
					throw new Error(
						'CRITICAL: Password save failed! DB returned old hash.'
					);
				}
				// ---------------------------

				console.log('✅ Password and Identity re-encrypted successfully');
				return { success: true };
			}),
		},

		actions: {
			assignProfile: assign(({ event }) => ({
				profile: event.output,
				error: null,
			})),

			assignServers: assign(({ event }) => ({
				signalingServers: event.output,
				activeServerId: event.output[0]?.id || null,
				error: null,
			})),

			updateProfile: assign(({ context, event }) => ({
				profile: {
					...context.profile,
					...event.updates,
				},
			})),

			addServer: assign(({ context, event }) => {
				const newServers = context.service.addCustomServer(
					context.signalingServers,
					event.url
				);

				return {
					signalingServers: newServers,
					activeServerId: newServers[newServers.length - 1].id,
				};
			}),

			removeServer: assign(({ context, event }) => {
				const newServers = context.service.removeServer(
					context.signalingServers,
					event.serverId
				);

				let newActiveId = context.activeServerId;
				if (newActiveId === event.serverId) {
					newActiveId = newServers.find((s) => s.isDefault)?.id || null;
				}

				return {
					signalingServers: newServers,
					activeServerId: newActiveId,
				};
			}),

			setActiveServer: assign(({ event, context }) => {
				const serverId = event.serverId;
				const newServer = context.signalingServers.find(
					(s) => s.id === serverId
				);

				// Уведомляем о смене сервера через EventBus
				if (newServer && context.eventBus) {
					setTimeout(() => {
						context.eventBus.dispatch({
							type: 'SIGNALING_SERVER_CHANGED',
							serverUrl: newServer.url,
							serverId: serverId,
						});
					}, 0);
				}

				return {
					activeServerId: serverId,
				};
			}),

			assignError: assign({
				error: ({ event }) => event.error?.message || 'Неизвестная ошибка',
				passwordSuccess: false,
			}),

			clearError: assign({
				error: null,
				passwordSuccess: false,
			}),

			logSaved: () => {
				console.log('✅ Settings saved');
			},

			setPasswordSuccess: assign({
				passwordSuccess: true,
				error: null,
			}),

			notifyProfileLoaded: ({ context }) => {
				if (context.eventBus && context.profile) {
					context.eventBus.dispatch(
						{
							type: 'PROFILE_UPDATED',
							username: context.username,
							profile: { ...context.profile },
						},
						'MEDIUM'
					);
				}
			},
		},

		guards: {
			hasProfile: ({ context }) => !!context.profile,
		},
	}).createMachine({
		id: 'settings',
		initial: 'loading',

		context: {
			repo,
			service,
			username,
			identity, // Храним Identity в контексте
			authService,
			authRepo,
			eventBus,

			profile: null,
			signalingServers: [],
			activeServerId: null,

			error: null,
			passwordSuccess: false,
		},

		states: {
			loading: {
				type: 'parallel',

				states: {
					profile: {
						initial: 'loading',
						states: {
							loading: {
								invoke: {
									src: 'loadProfile',
									input: ({ context }) => ({
										repo: context.repo,
										username: context.username,
									}),
									onDone: {
										target: 'loaded',
										actions: ['assignProfile', 'notifyProfileLoaded'],
									},
									onError: {
										target: 'error',
										actions: 'assignError',
									},
								},
							},
							loaded: { type: 'final' },
							error: {},
						},
					},

					servers: {
						initial: 'loading',
						states: {
							loading: {
								invoke: {
									src: 'loadServers',
									input: ({ context }) => ({
										repo: context.repo,
										service: context.service,
										username: context.username,
									}),
									onDone: {
										target: 'loaded',
										actions: 'assignServers',
									},
									onError: {
										target: 'error',
										actions: 'assignError',
									},
								},
							},
							loaded: { type: 'final' },
							error: {},
						},
					},
				},

				onDone: 'ready',
			},

			ready: {
				on: {
					UPDATE_PROFILE: {
						actions: ['updateProfile', 'clearError'],
					},
					SAVE_PROFILE: 'savingProfile',
					UPLOAD_AVATAR: 'processingAvatar',
					ADD_SERVER: {
						actions: ['addServer', 'clearError'],
						target: 'savingServers',
					},
					REMOVE_SERVER: {
						actions: ['removeServer', 'clearError'],
						target: 'savingServers',
					},
					SET_ACTIVE_SERVER: {
						actions: ['setActiveServer', 'clearError'],
						target: 'savingServers',
					},
					CHANGE_PASSWORD: {
						target: 'changingPassword',
						actions: 'clearError',
					},
				},
			},

			savingProfile: {
				invoke: {
					src: 'saveProfile',
					input: ({ context }) => ({
						profile: context.profile,
						repo: context.repo,
						service: context.service,
						eventBus: context.eventBus,
						username: context.username,
					}),
					onDone: {
						target: 'ready',
						actions: ['assignProfile', 'logSaved'],
					},
					onError: {
						target: 'ready',
						actions: 'assignError',
					},
				},
			},

			processingAvatar: {
				invoke: {
					src: 'processAvatar',
					input: ({ context, event }) => ({
						file: event.file,
						service: context.service,
					}),
					onDone: {
						target: 'savingProfile',
						actions: assign(({ context, event }) => ({
							profile: {
								...context.profile,
								avatar: event.output,
							},
						})),
					},
					onError: {
						target: 'ready',
						actions: 'assignError',
					},
				},
			},

			savingServers: {
				invoke: {
					src: 'saveServers',
					input: ({ context }) => ({
						servers: context.signalingServers,
						repo: context.repo,
						username: context.username,
					}),
					onDone: {
						target: 'ready',
						actions: 'logSaved',
					},
					onError: {
						target: 'ready',
						actions: 'assignError',
					},
				},
			},

			changingPassword: {
				invoke: {
					src: 'changePassword',
					input: ({ context, event }) => ({
						oldPassword: event.oldPassword,
						newPassword: event.newPassword,
						username: context.username,
						identity: context.identity, // <--- Передаем Identity из контекста
						authService: context.authService,
						authRepo: context.authRepo,
					}),
					onDone: {
						target: 'ready',
						actions: ['setPasswordSuccess'],
					},
					onError: {
						target: 'ready',
						actions: 'assignError',
					},
				},
			},
		},
	});
}
