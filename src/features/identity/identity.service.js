// Identity Service
import { persistenceService } from "../persistence/persistence.service.js";
import { cryptoService } from "../crypto/crypto.service.js";

class IdentityService {
	async createProfile(username, password) {
		// Генерируем ключевую пару
		const keyPair = await cryptoService.generateKeyPair();

		// Создаём профиль
		const profile = {
			userId: `user_${Date.now()}`,
			username,
			passwordHash: btoa(password), // ВНИМАНИЕ: это НЕ безопасно, только для демо!
			publicKey: keyPair.publicKey,
			privateKey: keyPair.privateKey,
			createdAt: Date.now(),
		};

		// Сохраняем в IndexedDB
		await persistenceService.set("profiles", profile);

		return profile;
	}

	async getProfile(userId) {
		return await persistenceService.get("profiles", userId);
	}

	async getProfileByUsername(username) {
		const profiles = await persistenceService.getAll("profiles");
		return profiles.find((p) => p.username === username);
	}

	async saveProfile(profile) {
		await persistenceService.set("profiles", profile);
	}
}

export const identityService = new IdentityService();
