// src/features/app-settings/app-settings.service.js

export class AppSettingsService {
	/**
	 * Дефолтные настройки навигации
	 */
	getDefaultNavigationItems() {
		return [
			{
				id: 'messages',
				label: 'Сообщения',
				icon: '💬',
				visible: true,
				order: 0,
			},
			{
				id: 'contacts',
				label: 'Контакты',
				icon: '👥',
				visible: true,
				order: 1,
			},
			{
				id: 'journal',
				label: 'Журнал',
				icon: '📝',
				visible: true,
				order: 2,
			},
			{
				id: 'discovery',
				label: 'Обзор',
				icon: '🌐',
				visible: true,
				order: 3,
			},
			{
				id: 'settings',
				label: 'Настройки',
				icon: '⚙️',
				visible: true,
				order: 4,
				locked: true, // нельзя скрыть
			},
			{
				id: 'profile',
				label: 'Профиль',
				icon: '👤',
				visible: true,
				order: 5,
			},
			{
				id: 'files',
				label: 'Файлы',
				icon: '📁',
				visible: true,
				order: 6,
			},
		];
	}

	/**
	 * Дефолтные настройки приложения
	 */
	getDefaultSettings() {
		return {
			navigation: {
				items: this.getDefaultNavigationItems(),
			},
			notifications: {
				messages: true,
				contactRequests: true,
				newDiscoveryUsers: false,
			},
			design: {
				themeHue: 270, // Фиолетовый по умолчанию
				spacingScale: 1, // 100% отступов
				fontSizeScale: 1, // 100% размер шрифта (1rem = 16px)
				themeMode: 'system', // Перенесли theme сюда или оставили в корне, как удобнее
			},
			theme: 'system', // 'light' | 'dark' | 'system'
		};
	}

	/**
	 * Валидация настроек навигации
	 */
	validateNavigationItems(items) {
		if (!Array.isArray(items) || items.length === 0) {
			return {
				valid: false,
				error: 'Список пунктов меню не может быть пустым',
			};
		}

		// Проверяем, что хотя бы один пункт видим
		const visibleCount = items.filter((i) => i.visible).length;
		if (visibleCount === 0) {
			return {
				valid: false,
				error: 'Должен быть виден хотя бы один пункт меню',
			};
		}

		// Проверяем, что "Настройки" видимы (если есть locked: true)
		const settingsItem = items.find((i) => i.id === 'settings');
		if (settingsItem?.locked && !settingsItem.visible) {
			return {
				valid: false,
				error: 'Пункт "Настройки" нельзя скрыть',
			};
		}

		return { valid: true };
	}

	/**
	 * Сброс к дефолтным настройкам
	 */
	resetToDefaults() {
		return this.getDefaultSettings();
	}
}
