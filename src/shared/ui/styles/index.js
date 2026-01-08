// src/shared/ui/styles/index.js

// Явные импорты всех стилей
import { resetStyles } from './reset.css.js';
import { typographyStyles } from './typography.css.js';
import { sectionStyles } from './section.css.js';
import { formStyles } from './form.css.js';
import { buttonStyles } from './button.css.js';
import { avatarStyles } from './avatar.css.js';
import { layoutStyles } from './layout.css.js';
import { tokens } from './tokens.css.js';

// Реэкспорт всех именованных стилей
export {
	resetStyles,
	typographyStyles,
	sectionStyles,
	formStyles,
	buttonStyles,
	avatarStyles,
	layoutStyles,
	tokens,
};

/**
 * Глобальные базовые стили (сброс + типографика + токены)
 * Использование: static styles = [globalStyles];
 */
export const globalStyles = [resetStyles, typographyStyles, tokens];

/**
 * Базовый набор стилей для большинства компонентов
 * Использование: static styles = [baseStyles, css`...`];
 */
export const baseStyles = [globalStyles, layoutStyles, buttonStyles];

/**
 * Полный набор стилей для форм
 * Использование: static styles = [formBaseStyles, css`...`];
 */
export const formBaseStyles = [
	globalStyles,
	sectionStyles,
	formStyles,
	buttonStyles,
	layoutStyles,
];
