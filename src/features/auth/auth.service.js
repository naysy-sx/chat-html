// src/features/auth/auth.service.js

export class AuthService {
	constructor(cryptoService) {
		this.crypto = cryptoService;
	}

	/**
	 * Хешировать пароль для хранения
	 * @returns {{ hash: string, salt: string }}
	 */
	async hashPassword(password) {
		const result = await this.crypto.request('deriveKeyFromPassword', {
			password,
			salt: null, // генерируем новую соль
			usage: 'verification',
		});

		return {
			hash: result.keyHash,
			salt: result.salt,
		};
	}

	/**
	 * Проверить пароль
	 */
	async verifyPassword(password, storedHash, salt) {
		const result = await this.crypto.request('deriveKeyFromPassword', {
			password,
			salt,
			usage: 'verification',
		});

		return result.keyHash === storedHash;
	}

	/**
	 * Зашифровать данные паролем пользователя
	 */
	async encryptUserData(data, password, salt) {
		return this.crypto.request('encryptWithPassword', {
			data,
			password,
			salt,
		});
	}

	/**
	 * Расшифровать данные паролем пользователя
	 */
	async decryptUserData(encryptedData, password, salt) {
		return this.crypto.request('decryptWithPassword', {
			encryptedData,
			password,
			salt,
		});
	}

	/**
	 * Валидация username
	 */
	validateUsername(username) {
		if (!username || username.length < 2) {
			return { valid: false, error: 'Минимум 2 символа' };
		}
		if (username.length > 32) {
			return { valid: false, error: 'Максимум 32 символа' };
		}
		if (!/^[a-zA-Z0-9_а-яА-ЯёЁ]+$/.test(username)) {
			return { valid: false, error: 'Только буквы, цифры и _' };
		}
		return { valid: true };
	}

	/**
	 * Валидация пароля
	 */
	validatePassword(password) {
		if (!password || password.length < 4) {
			return { valid: false, error: 'Минимум 4 символа' };
		}
		if (password.length > 128) {
			return { valid: false, error: 'Максимум 128 символов' };
		}
		return { valid: true };
	}
}
