import { PersistenceService } from './persistence.service.js';

export const persistenceFeature = {
	id: 'persistence',
	name: 'Persistence',
	version: '1.0.0',

	// Нет зависимостей - базовая фича
	dependencies: [],
	ui: {
		diagnostics: 'persistence-diagnostics',
	},

	async onMount(context) {
		console.log('💾 Mounting Persistence feature...');

		// Создаём сервис
		const service = new PersistenceService();

		// Инициализируем БД
		await service.init();

		console.log('✅ Persistence ready');

		// Возвращаем сервис для использования другими фичами
		return { service };
	},

	async onUnmount(context) {
		const { service } = context;

		if (service) {
			await service.close();
		}

		console.log('💾 Persistence unmounted');
	},

	// Эта фича не слушает события (она базовая)
	subscribedEvents: [],

	// Может отправлять события об ошибках
	emittedEvents: ['STORAGE_ERROR', 'STORAGE_QUOTA_EXCEEDED'],
};
