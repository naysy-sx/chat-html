// src/shared/ui/styles/typography.css.js
import { css } from 'lit';

/**
 * Типографика: шрифты, размеры текста, интерлиньяж, утилиты
 */
export const typographyStyles = css`
	/* ===== Font Sizes (Fluid/Adaptive) ===== */
	:host {
		--text-xs: clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem);
		--text-sm: clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem);
		--text-body: clamp(0.9375rem, 0.875rem + 0.25vw, 1.0625rem);
		--text-base: var(--text-body);
		--text-md: clamp(1rem, 0.95rem + 0.3vw, 1.125rem);
		--text-lg: clamp(1.0625rem, 0.95rem + 0.5vw, 1.25rem);
		--text-xl: clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem);
		--text-2xl: clamp(1.5rem, 1.25rem + 1vw, 2rem);
		--text-3xl: clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem);

		/* ===== Line Heights ===== */
		--line-tight: 1.2;
		--line-normal: 1.5;
		--line-loose: 1.8;

		/* ===== Font Weights ===== */
		--font-weight-light: 300;
		--font-weight-normal: 400;
		--font-weight-medium: 500;
		--font-weight-semibold: 600;
		--font-weight-bold: 700;

		/* ===== Font Families ===== */
		--font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
			Roboto, Helvetica, Arial, sans-serif;
		--font-mono: ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', 'Courier New',
			monospace;

		/* ===== Spacing (Fluid/Adaptive) ===== */
		--space-3xs: clamp(0.25rem, 0.2rem + 0.2vw, 0.375rem);
		--space-2xs: clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem);
		--space-xs: clamp(0.5rem, 0.45rem + 0.25vw, 0.625rem);
		--space-s: clamp(0.625rem, 0.55rem + 0.35vw, 0.875rem);
		--space-m: clamp(0.875rem, 0.8rem + 0.4vw, 1.125rem);
		--space-l: clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem);
		--space-xl: clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem);
		--space-2xl: clamp(2.5rem, 2rem + 2vw, 4rem);
	}

	/* ===== Text Utilities ===== */
	.text-xs {
		font-size: var(--text-xs);
		line-height: var(--line-normal);
	}

	.text-sm {
		font-size: var(--text-sm);
		line-height: var(--line-normal);
	}

	.text-body,
	.text-base {
		font-size: var(--text-body);
		line-height: var(--line-normal);
	}

	.text-md {
		font-size: var(--text-md);
		line-height: var(--line-normal);
	}

	.text-lg {
		font-size: var(--text-lg);
		line-height: var(--line-normal);
	}

	.text-xl {
		font-size: var(--text-xl);
		line-height: var(--line-tight);
	}

	.text-2xl {
		font-size: var(--text-2xl);
		line-height: var(--line-tight);
	}

	.text-3xl {
		font-size: var(--text-3xl);
		line-height: var(--line-tight);
	}

	/* ===== Font Weight Utilities ===== */
	.font-light {
		font-weight: var(--font-weight-light);
	}

	.font-normal {
		font-weight: var(--font-weight-normal);
	}

	.font-medium {
		font-weight: var(--font-weight-medium);
	}

	.font-semibold {
		font-weight: var(--font-weight-semibold);
	}

	.font-bold {
		font-weight: var(--font-weight-bold);
	}

	/* ===== Line Height Utilities ===== */
	.leading-tight {
		line-height: var(--line-tight);
	}

	.leading-normal {
		line-height: var(--line-normal);
	}

	.leading-loose {
		line-height: var(--line-loose);
	}

	/* ===== Text Decorations ===== */
	.text-underline {
		text-decoration: underline;
	}

	.text-line-through {
		text-decoration: line-through;
	}

	.text-truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ===== Text Alignment ===== */
	.text-left {
		text-align: left;
	}

	.text-center {
		text-align: center;
	}

	.text-right {
		text-align: right;
	}

	.text-justify {
		text-align: justify;
	}

	/* ===== Text Transform ===== */
	.text-uppercase {
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.text-lowercase {
		text-transform: lowercase;
	}

	.text-capitalize {
		text-transform: capitalize;
	}

	/* ===== Text Colors ===== */
	.text-main {
		color: var(--color-text-main);
	}

	.text-muted {
		color: var(--color-text-muted);
	}

	.text-secondary {
		color: var(--color-text-muted);
	}

	.text-primary {
		color: var(--color-primary);
	}

	.text-success {
		color: var(--color-success);
	}

	.text-warning {
		color: var(--color-warning);
	}

	.text-danger {
		color: var(--color-danger);
	}

	/* ===== Headings Utilities ===== */
	.heading-xs {
		font-size: var(--text-sm);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-tight);
	}

	.heading-sm {
		font-size: var(--text-md);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-tight);
	}

	.heading-base {
		font-size: var(--text-lg);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-tight);
	}

	.heading-md {
		font-size: var(--text-xl);
		font-weight: var(--font-weight-semibold);
		line-height: var(--line-tight);
	}

	.heading-lg {
		font-size: var(--text-2xl);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-tight);
	}

	/* ===== Word Wrap & Break ===== */
	.break-words {
		word-break: break-word;
		overflow-wrap: break-word;
	}

	.break-all {
		word-break: break-all;
	}

	.no-wrap {
		white-space: nowrap;
	}

	/* ===== Letter Spacing ===== */
	.tracking-tight {
		letter-spacing: -0.02em;
	}

	.tracking-normal {
		letter-spacing: 0;
	}

	.tracking-wide {
		letter-spacing: 0.05em;
	}

	.tracking-wider {
		letter-spacing: 0.1em;
	}

	/* ===== Selection ===== */
	::selection {
		background-color: var(--color-primary-soft);
		color: var(--color-text-main);
	}
`;
