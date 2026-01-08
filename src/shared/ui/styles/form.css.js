// src/shared/ui/styles/form.css.js
import { css } from 'lit';

/**
 * Стили для форм: инпуты, лейблы, группы, валидация
 */
export const formStyles = css`
	/* ===== Form Group ===== */
	.form-group {
		margin-bottom: var(--space-m);
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	/* ===== Labels ===== */
	.label {
		display: block;
		margin-bottom: var(--space-xs);
		font-weight: 500;
		font-size: var(--text-sm);
		color: var(--color-text-main);
	}

	.label--required::after {
		content: ' *';
		color: var(--color-danger);
	}

	/* ===== Inputs ===== */
	.input,
	.textarea,
	.select {
		width: 100%;
		padding: var(--space-s) var(--space-m);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-m);
		font-size: var(--text-body);
		font-family: inherit;
		background: var(--color-bg);
		color: var(--color-text-main);
		transition: border-color var(--transition-fast),
			box-shadow var(--transition-fast);
		box-sizing: border-box;
	}

	.input:focus,
	.textarea:focus,
	.select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-soft);
	}

	.input::placeholder,
	.textarea::placeholder {
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	.textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* ===== Validation States ===== */
	.input--valid,
	.input.valid {
		border-color: var(--color-success);
		box-shadow: 0 0 0 1px var(--color-success);
	}

	.input--invalid,
	.input.invalid {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 1px var(--color-danger);
	}

	/* ===== Disabled State ===== */
	.input:disabled,
	.textarea:disabled,
	.select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--color-surface-raised);
	}

	/* ===== Help Text ===== */
	.help-text {
		margin-top: var(--space-xs);
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: var(--line-normal);
	}

	.help-text--error {
		color: var(--color-danger-text);
	}

	/* ===== Checkbox Group ===== */
	.checkbox-group {
		display: flex;
		align-items: flex-start;
		gap: var(--space-s);
		padding: var(--space-m);
		background: var(--color-surface-raised);
		border-radius: var(--radius-m);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.checkbox-group:hover {
		background: var(--color-bg-hover);
	}

	.checkbox-input {
		width: 20px;
		height: 20px;
		margin: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
		flex-shrink: 0;
	}

	.checkbox-content {
		flex: 1;
		min-width: 0;
	}

	.checkbox-label {
		font-weight: 500;
		color: var(--color-text-main);
		margin-bottom: var(--space-3xs);
	}

	.checkbox-description {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
		line-height: var(--line-normal);
	}

	/* ===== File Input ===== */
	.file-input {
		display: none;
	}
`;
