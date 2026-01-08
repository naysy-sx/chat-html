// src/features/auth/auth.repository.js

export class AuthRepository {
	constructor(storage) {
		this.storage = storage;
	}

	/**
	 * Получить пользователя по username
	 */
	async getUser(username) {
		return this.storage.getUser(username);
	}

	/**
	 * Проверить существует ли пользователь
	 */
	async userExists(username) {
		return this.storage.userExists(username);
	}

	/**
	 * Создать нового пользователя
	 * @param {Object} userData - { username, passwordHash, salt, createdAt }
	 */
	async createUser(userData) {
		// Проверяем что пользователь не существует
		if (await this.userExists(userData.username)) {
			throw new Error('USER_EXISTS');
		}

		await this.storage.saveUser(userData);
		return userData;
	}

	/**
	 * Обновить данные пользователя (для смены пароля)
	 */
	async updateUser(username, updates) {
		const user = await this.getUser(username);
		if (!user) {
			throw new Error('USER_NOT_FOUND');
		}

		const updatedUser = {
			...user,
			...updates,
			updatedAt: Date.now(),
		};

		await this.storage.saveUser(updatedUser);
		return updatedUser;
	}

	/**
	 * Сохранить зашифрованные данные пользователя
	 */
	async saveUserData(username, key, encryptedData) {
		const storageKey = `${username}:${key}`;
		await this.storage.set(storageKey, encryptedData);
	}

	/**
	 * Загрузить зашифрованные данные пользователя
	 */
	async getUserData(username, key) {
		const storageKey = `${username}:${key}`;
		return this.storage.get(storageKey);
	}

	/**
	 * Удалить пользователя и все его данные
	 */
	async deleteUser(username) {
		// Удаляем запись пользователя
		await this.storage.deleteUser(username);

		// Удаляем все данные пользователя (identity, settings, etc)
		const allData = await this.storage.getAll('data');
		const userPrefix = `${username}:`;

		for (const item of allData) {
			if (item.key.startsWith(userPrefix)) {
				await this.storage.delete(item.key);
			}
		}

		// TODO: удалить сообщения пользователя из messages store
	}

	/**
	 * Получить список всех пользователей (для отображения на экране входа)
	 */
	async getAllUsernames() {
		const users = await this.storage.getAllUsers();
		return users.map((u) => ({
			username: u.username,
			createdAt: u.createdAt,
		}));
	}
}
