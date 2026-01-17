// src/features/app-settings/app-settings.repository.js

export class AppSettingsRepository {
	constructor(persistenceService) {
		this.storage = persistenceService;
	}

	/**
	 * Загрузить настройки для пользователя
	 */
	async getSettings(username) {
		return this.storage.get(`app-settings:${username}`, 'data');
	}

	/**
	 * Сохранить настройки для пользователя
	 */
	async saveSettings(username, settings) {
		return this.storage.set(`app-settings:${username}`, settings, 'data');
	}
}
