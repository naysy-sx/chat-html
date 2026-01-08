// src/features/auth/auth.events.js

export const AuthEvents = {
	// Отправляемые пользователем
	LOGIN: 'LOGIN',
	REGISTER: 'REGISTER',
	LOGOUT: 'LOGOUT',
	DELETE_ACCOUNT: 'DELETE_ACCOUNT',

	// Внутренние
	AUTH_SUCCESS: 'AUTH_SUCCESS',
	AUTH_FAILURE: 'AUTH_FAILURE',
};

// Типы для документации
export const AuthEventPayloads = {
	LOGIN: { username: 'string', password: 'string' },
	REGISTER: { username: 'string', password: 'string' },
	LOGOUT: {},
	DELETE_ACCOUNT: {},
};
