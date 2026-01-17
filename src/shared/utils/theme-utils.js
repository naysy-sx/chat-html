export function applyTheme(designSettings) {
	const root = document.documentElement;

	// 1. Цвет
	if (designSettings.themeHue !== undefined) {
		root.style.setProperty('--app-hue', designSettings.themeHue);
	}

	// 2. Отступы
	if (designSettings.spacingScale !== undefined) {
		root.style.setProperty('--app-spacing-scale', designSettings.spacingScale);
	}

	// 3. Размер шрифта (влияет на все rem)
	// Базовый размер 100% = 16px. Меняем проценты.
	if (designSettings.fontSizeScale !== undefined) {
		const percentage = designSettings.fontSizeScale * 100;
		root.style.fontSize = `${percentage}%`;
	}
}
