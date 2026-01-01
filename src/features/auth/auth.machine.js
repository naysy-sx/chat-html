// Auth Machine
import { setup, assign, fromPromise } from "xstate";
import { identityService } from "../identity/identity.service.js";

export const authMachine = setup({
	types: {
		context: {},
		events: {},
	},

	actors: {
		checkStoredSession: fromPromise(async () => {
			const session = localStorage.getItem("session");
			if (session) {
				const data = JSON.parse(session);
				return { userId: data.userId, token: data.token };
			}
			throw new Error("No session");
		}),

		login: fromPromise(async ({ input }) => {
			const { username, password } = input;
			const profile = await identityService.getProfileByUsername(username);

			if (!profile) {
				throw new Error("User not found");
			}

			// Простая проверка пароля (НЕ безопасно!)
			if (profile.passwordHash !== btoa(password)) {
				throw new Error("Invalid password");
			}

			// Создаём сессию
			const session = {
				userId: profile.userId,
				token: `token_${Date.now()}`,
			};
			localStorage.setItem("session", JSON.stringify(session));

			return session;
		}),

		signup: fromPromise(async ({ input }) => {
			const { username, password } = input;

			// Проверяем, что username не занят
			const existing = await identityService.getProfileByUsername(username);
			if (existing) {
				throw new Error("Username already exists");
			}

			// Создаём профиль
			const profile = await identityService.createProfile(username, password);

			// Создаём сессию
			const session = {
				userId: profile.userId,
				token: `token_${Date.now()}`,
			};
			localStorage.setItem("session", JSON.stringify(session));

			return session;
		}),

		logout: fromPromise(async () => {
			localStorage.removeItem("session");
			return { success: true };
		}),
	},
}).createMachine({
	id: "auth",

	initial: "checkingSession",

	context: {
		userId: null,
		sessionToken: null,
		error: null,
		username: null,
		password: null,
	},

	states: {
		checkingSession: {
			invoke: {
				src: "checkStoredSession",
				onDone: {
					target: "authenticated",
					actions: assign({
						userId: ({ event }) => event.output.userId,
						sessionToken: ({ event }) => event.output.token,
					}),
				},
				onError: {
					target: "unauthenticated",
				},
			},
		},

		unauthenticated: {
			on: {
				LOGIN: {
					target: "loggingIn",
					actions: assign({
						username: ({ event }) => event.username,
						password: ({ event }) => event.password,
						error: null,
					}),
				},
				SIGNUP: {
					target: "signingUp",
					actions: assign({
						username: ({ event }) => event.username,
						password: ({ event }) => event.password,
						error: null,
					}),
				},
			},
		},

		loggingIn: {
			invoke: {
				src: "login",
				input: ({ context }) => ({
					username: context.username,
					password: context.password,
				}),
				onDone: {
					target: "authenticated",
					actions: assign({
						userId: ({ event }) => event.output.userId,
						sessionToken: ({ event }) => event.output.token,
						error: null,
					}),
				},
				onError: {
					target: "unauthenticated",
					actions: assign({
						error: ({ event }) => event.error.message,
					}),
				},
			},
		},

		signingUp: {
			invoke: {
				src: "signup",
				input: ({ context }) => ({
					username: context.username,
					password: context.password,
				}),
				onDone: {
					target: "authenticated",
					actions: assign({
						userId: ({ event }) => event.output.userId,
						sessionToken: ({ event }) => event.output.token,
						error: null,
					}),
				},
				onError: {
					target: "unauthenticated",
					actions: assign({
						error: ({ event }) => event.error.message,
					}),
				},
			},
		},

		authenticated: {
			on: {
				LOGOUT: {
					target: "loggingOut",
				},
				SESSION_EXPIRED: {
					target: "unauthenticated",
				},
			},
		},

		loggingOut: {
			invoke: {
				src: "logout",
				onDone: {
					target: "unauthenticated",
					actions: assign({
						userId: null,
						sessionToken: null,
					}),
				},
			},
		},
	},
});
