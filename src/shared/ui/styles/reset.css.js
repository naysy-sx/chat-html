// src/shared/ui/styles/reset.css.js
import { css } from 'lit';

/**
 * Сброс стилей браузера + базовые стили для всех элементов
 */
export const resetStyles = css`
	/* ===== Universal Reset ===== */
	*,
	*::before,
	*::after {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	html {
		font-size: 16px;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		scroll-behavior: smooth;
	}

	body {
		margin: 0;
		padding: 0;
		background: var(--color-bg);
		color: var(--color-text-main);
		font-family: var(--font-family);
		font-size: var(--text-body);
		line-height: var(--line-normal);
		overflow-x: hidden;
	}

	/* ===== Headings ===== */
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		margin: 0;
		padding: 0;
		font-weight: 600;
		line-height: var(--line-tight, 1.2);
	}

	h1 {
		font-size: var(--text-2xl, 2rem);
	}

	h2 {
		font-size: var(--text-xl, 1.5rem);
	}

	h3 {
		font-size: var(--text-lg, 1.25rem);
	}

	h4 {
		font-size: var(--text-md, 1.125rem);
	}

	h5 {
		font-size: var(--text-body, 1rem);
	}

	h6 {
		font-size: var(--text-sm, 0.875rem);
	}

	/* ===== Paragraph & Text ===== */
	p {
		margin: 0;
		padding: 0;
	}

	a {
		color: var(--color-primary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	a:hover {
		color: var(--color-primary-dark);
	}

	/* ===== Lists ===== */
	ul,
	ol {
		margin: 0;
		padding-left: 1.5em;
	}

	li {
		margin: 0;
		padding: 0;
	}

	/* ===== Form Elements ===== */
	button,
	input,
	textarea,
	select {
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	button {
		cursor: pointer;
		border: none;
		background: none;
		padding: 0;
	}

	input,
	textarea,
	select {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
	}

	input[type='checkbox'],
	input[type='radio'] {
		cursor: pointer;
	}

	textarea {
		resize: none;
	}

	/* ===== Tables ===== */
	table {
		border-collapse: collapse;
		border-spacing: 0;
		width: 100%;
	}

	th,
	td {
		padding: 0;
		text-align: left;
		border-collapse: collapse;
	}

	/* ===== Media ===== */
	img,
	video,
	iframe {
		max-width: 100%;
		height: auto;
		display: block;
	}

	/* ===== Pre & Code ===== */
	pre,
	code,
	kbd,
	samp {
		font-family: var(--font-mono, 'Courier New', monospace);
		font-size: 0.875em;
	}

	pre {
		overflow-x: auto;
		background: var(--color-surface-raised);
		padding: 1em;
		border-radius: var(--radius-m);
	}

	/* ===== Blockquote ===== */
	blockquote {
		margin: 0;
		padding-left: 1em;
		border-left: 4px solid var(--color-primary);
		color: var(--color-text-muted);
	}

	/* ===== Hr ===== */
	hr {
		margin: 1em 0;
		border: none;
		border-top: 1px solid var(--color-border);
	}

	/* ===== Focus Visible (Accessibility) ===== */
	:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	/* ===== Disabled State ===== */
	:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;
