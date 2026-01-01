// Persistence Feature
import { persistenceService } from "./persistence.service.js";

export const persistenceFeature = {
	id: "persistence",
	name: "Persistence",
	version: "1.0.0",

	async onMount(context) {
		// Инициализируем IndexedDB
		await persistenceService.init();
		console.log("✅ Persistence initialized");

		// Добавляем сервис в контекст
		return { service: persistenceService };
	},

	async onUnmount(context) {
		// Cleanup если нужно
	},
};
