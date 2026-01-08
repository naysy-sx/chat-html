// src/features/auth/auth.machine.js

import { setup, assign, fromPromise } from 'xstate';

export function createAuthMachine({ authService, authRepo, cryptoService }) {
	return setup({
		actors: {
			// Регистрация нового пользователя
			registerUser: fromPromise(async ({ input }) => {
				const { username, password, authService, authRepo, cryptoService } =
					input;

				console.log('📝 Registering user:', username);

				// Валидация
				const usernameCheck = authService.validateUsername(username);
				if (!usernameCheck.valid) {
					throw new Error(usernameCheck.error);
				}

				const passwordCheck = authService.validatePassword(password);
				if (!passwordCheck.valid) {
					throw new Error(passwordCheck.error);
				}

				// Проверяем что пользователь не существует
				if (await authRepo.userExists(username)) {
					throw new Error('Пользователь уже существует');
				}

				// Хешируем пароль
				const { hash, salt } = await authService.hashPassword(password);

				// Создаём пользователя
				const user = {
					username,
					passwordHash: hash,
					salt,
					createdAt: Date.now(),
				};

				await authRepo.createUser(user);

				// Генерируем identity для пользователя
				const identity = await cryptoService.generateIdentity();

				// Шифруем identity паролем
				const encryptedIdentity = await authService.encryptUserData(
					identity,
					password,
					salt
				);

				// Сохраняем зашифрованную identity
				await authRepo.saveUserData(username, 'identity', encryptedIdentity);

				console.log('✅ User registered:', username);

				return {
					username,
					identity,
					salt,
				};
			}),

			// Вход пользователя
			loginUser: fromPromise(async ({ input }) => {
				const { username, password, authService, authRepo } = input;

				console.log('🔐 Logging in:', username);

				// Получаем пользователя
				const user = await authRepo.getUser(username);
				if (!user) {
					throw new Error('Неверный логин или пароль');
				}

				// Проверяем пароль
				const isValid = await authService.verifyPassword(
					password,
					user.passwordHash,
					user.salt
				);

				if (!isValid) {
					throw new Error('Неверный логин или пароль');
				}

				// Загружаем и расшифровываем identity
				const encryptedIdentity = await authRepo.getUserData(
					username,
					'identity'
				);
				if (!encryptedIdentity) {
					throw new Error('Данные пользователя повреждены');
				}

				const identity = await authService.decryptUserData(
					encryptedIdentity,
					password,
					user.salt
				);

				console.log('✅ Logged in:', username);

				return {
					username,
					identity,
					salt: user.salt,
				};
			}),

			// Удаление аккаунта
			deleteAccount: fromPromise(async ({ input }) => {
				const { username, authRepo } = input;

				console.log('🗑️ Deleting account:', username);

				await authRepo.deleteUser(username);

				console.log('✅ Account deleted:', username);

				return { success: true };
			}),

			// Загрузка списка пользователей
			loadUsers: fromPromise(async ({ input }) => {
				const { authRepo } = input;
				return authRepo.getAllUsernames();
			}),
		},

		actions: {
			assignUser: assign(({ event }) => ({
				username: event.output.username,
				identity: event.output.identity,
				salt: event.output.salt,
				error: null,
			})),

			assignError: assign({
				error: ({ event }) => event.error?.message || 'Неизвестная ошибка',
			}),

			clearError: assign({
				error: null,
			}),

			clearUser: assign({
				username: null,
				identity: null,
				salt: null,
				password: null, // никогда не храним пароль!
			}),

			assignUsers: assign({
				availableUsers: ({ event }) => event.output,
			}),

			logAuthenticated: ({ context }) => {
				console.log('🎉 Authenticated as:', context.username);
			},

			logLogout: ({ context }) => {
				console.log('👋 Logged out:', context.username);
			},
		},

		guards: {
			hasUsers: ({ context }) => context.availableUsers?.length > 0,
		},
	}).createMachine({
		id: 'auth',
		initial: 'initializing',

		context: {
			// Зависимости
			authService,
			authRepo,
			cryptoService,

			// Состояние
			username: null,
			identity: null,
			salt: null,
			error: null,
			availableUsers: [],
		},

		states: {
			initializing: {
				invoke: {
					src: 'loadUsers',
					input: ({ context }) => ({
						authRepo: context.authRepo,
					}),
					onDone: {
						target: 'guest',
						actions: 'assignUsers',
					},
					onError: {
						target: 'guest',
					},
				},
			},

			guest: {
				entry: 'clearUser',
				on: {
					LOGIN: {
						target: 'loggingIn',
						actions: 'clearError',
					},
					REGISTER: {
						target: 'registering',
						actions: 'clearError',
					},
				},
			},

			registering: {
				invoke: {
					src: 'registerUser',
					input: ({ context, event }) => ({
						username: event.username,
						password: event.password,
						authService: context.authService,
						authRepo: context.authRepo,
						cryptoService: context.cryptoService,
					}),
					onDone: {
						target: 'authenticated',
						actions: 'assignUser',
					},
					onError: {
						target: 'guest',
						actions: 'assignError',
					},
				},
			},

			loggingIn: {
				invoke: {
					src: 'loginUser',
					input: ({ context, event }) => ({
						username: event.username,
						password: event.password,
						authService: context.authService,
						authRepo: context.authRepo,
					}),
					onDone: {
						target: 'authenticated',
						actions: 'assignUser',
					},
					onError: {
						target: 'guest',
						actions: 'assignError',
					},
				},
			},

			authenticated: {
				entry: 'logAuthenticated',
				on: {
					LOGOUT: {
						target: 'guest',
						actions: 'logLogout',
					},
					DELETE_ACCOUNT: {
						target: 'deletingAccount',
					},
				},
			},

			deletingAccount: {
				invoke: {
					src: 'deleteAccount',
					input: ({ context }) => ({
						username: context.username,
						authRepo: context.authRepo,
					}),
					onDone: {
						target: 'initializing', // перезагружаем список пользователей
						actions: ['clearUser', 'logLogout'],
					},
					onError: {
						target: 'authenticated',
						actions: 'assignError',
					},
				},
			},
		},
	});
}
