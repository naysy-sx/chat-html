// src/features/settings/settings.repository.js

export class SettingsRepository {
	constructor(persistenceService) {
		this.storage = persistenceService;
	}

	// Профиль
	async getProfile(username) {
		// Добавляем username в ключ
		return this.storage.get(`settings:${username}:profile`, 'data');
	}

	async saveProfile(username, profile) {
		// Добавляем username в ключ
		return this.storage.set(`settings:${username}:profile`, profile, 'data');
	}

	// Сигнальные серверы
	async getSignalingServers(username) {
		const servers = await this.storage.get(
			`settings:${username}:servers`,
			'data'
		);
		return servers || [];
	}

	async saveSignalingServers(username, servers) {
		return this.storage.set(`settings:${username}:servers`, servers, 'data');
	}
}
