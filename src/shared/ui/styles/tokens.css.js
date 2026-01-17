// src/shared/ui/styles/tokens.css.js
/**
 * Токены дизайна: цвета, радиусы, тени, переходы
 * Цветовая палитра строится на базе oklch с переменными hue и lightness
 */

import { css } from 'lit';

export const tokens = css`
	:host {
		/* ===== Color Palette Base (Hue Values) ===== */
		--hue-primary: var(--app-hue, 270);
		--hue-danger: 0;
		--hue-success: 142;
		--hue-warning: 38;

		/* ===== Lightness Scale (Light Mode) ===== */
		--l-bg: 99%;
		--l-surface: 100%;
		--l-raised: 97%;
		--l-hover: 95%;
		--l-border: 90%;
		--l-muted: 52%;
		--l-text: 18%;

		/* ===== Semantic Colors ===== */
		--color-bg: oklch(var(--l-bg) 0 0);
		--color-surface: oklch(var(--l-surface) 0 0);
		--color-surface-raised: oklch(var(--l-raised) 0 0);
		--color-bg-hover: oklch(var(--l-hover) 0 0);
		--color-text-main: oklch(var(--l-text) 0 0);
		--color-text-muted: oklch(var(--l-muted) 0 0);
		--color-text-secondary: oklch(var(--l-muted) 0 0);
		--color-border: oklch(var(--l-border) 0 0);
		--border-color: var(--color-border);
		--color-white: oklch(100% 0 0);
		--color-black: oklch(0% 0 0);

		/* ===== Primary Color (Vibrant, High Visibility) ===== */
		--color-primary: oklch(60% 0.3 var(--hue-primary));
		--color-primary-dark: oklch(48% 0.28 var(--hue-primary));
		--color-primary-soft: oklch(93% 0.08 var(--hue-primary));
		--color-primary-muted: oklch(72% 0.12 var(--hue-primary));

		/* ===== Danger Color (Red, Clear Distinction) ===== */
		--color-danger: oklch(56% 0.22 var(--hue-danger));
		--color-danger-soft: oklch(93% 0.08 var(--hue-danger));
		--color-danger-border: oklch(82% 0.1 var(--hue-danger));
		--color-danger-text: oklch(42% 0.18 var(--hue-danger));

		/* ===== Success Color (Green, Clear Distinction) ===== */
		--color-success: oklch(60% 0.18 var(--hue-success));
		--color-success-soft: oklch(93% 0.06 var(--hue-success));
		--color-success-border: oklch(82% 0.09 var(--hue-success));
		--color-success-text: oklch(42% 0.14 var(--hue-success));

		/* ===== Warning Color (Amber/Orange, High Visibility) ===== */
		--color-warning: oklch(60% 0.24 var(--hue-warning));
		--color-warning-soft: oklch(93% 0.08 var(--hue-warning));
		--color-warning-border: oklch(82% 0.12 var(--hue-warning));
		--color-warning-text: oklch(42% 0.18 var(--hue-warning));

		/* ===== Border Radius ===== */
		--radius-xs: 4px;
		--radius-s: 6px;
		--radius-m: 8px;
		--radius-l: 12px;
		--radius-xl: 16px;
		--radius-full: 9999px;

		/* ===== Indicator Sizes ===== */
		--indicator-size-sm: 8px;
		--indicator-size-md: 12px;
		--indicator-size-lg: 16px;

		/* ===== Shadows ===== */
		--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
		--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
		--shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.1);
		--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.05);

		/* ===== Transitions ===== */
		--transition-fast: 0.15s ease;
		--transition-normal: 0.2s ease;
		--transition-slow: 0.3s ease;

		/* ===== Avatar Sizes ===== */
		--avatar-size-sm: 32px;
		--avatar-size-md: 48px;
		--avatar-size-lg: 64px;

		/* ===== Gradient Variables ===== */
		--gradient-auth: linear-gradient(135deg, oklch(60% 0.3 270) 0%, oklch(50% 0.25 280) 100%);

		/* ===== Z-Index ===== */
		--z-dropdown: 100;
		--z-sticky: 200;
		--z-modal: 300;
		--z-toast: 400;
	}

	/* ===== Dark Mode ===== */
	@media (prefers-color-scheme: dark) {
		:host {
			--l-bg: 13%;
			--l-surface: 18%;
			--l-raised: 22%;
			--l-hover: 28%;
			--l-border: 32%;
			--l-muted: 58%;
			--l-text: 87%;

			/* Primary — более яркий для тёмного фона */
			--color-primary: oklch(70% 0.3 var(--hue-primary));
			--color-primary-dark: oklch(60% 0.28 var(--hue-primary));
			--color-primary-soft: oklch(30% 0.1 var(--hue-primary));
			--color-primary-muted: oklch(45% 0.12 var(--hue-primary));

			/* Danger — достаточно яркий, но не режущий */
			--color-danger: oklch(68% 0.22 var(--hue-danger));
			--color-danger-soft: oklch(28% 0.08 var(--hue-danger));
			--color-danger-border: oklch(40% 0.12 var(--hue-danger));

			/* Success — достаточно яркий */
			--color-success: oklch(70% 0.18 var(--hue-success));
			--color-success-soft: oklch(28% 0.07 var(--hue-success));
			--color-success-border: oklch(40% 0.1 var(--hue-success));

			/* Warning — хорошо видимый */
			--color-warning: oklch(70% 0.24 var(--hue-warning));
			--color-warning-soft: oklch(28% 0.1 var(--hue-warning));
			--color-warning-border: oklch(40% 0.12 var(--hue-warning));

		/* ===== Avatar Sizes (Dark Mode) ===== */
		--avatar-size-sm: 32px;
		--avatar-size-md: 48px;
		--avatar-size-lg: 64px;

		/* ===== Gradient Variables (Dark Mode) ===== */
		--gradient-auth: linear-gradient(135deg, oklch(70% 0.3 270) 0%, oklch(60% 0.25 280) 100%);
	}
`;
