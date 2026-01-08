// src/shared/ui/styles/button.css.js
import { css } from 'lit';

/**
 * Стили кнопок: primary, secondary, danger, ghost, icon
 */
export const buttonStyles = css`
	/* ===== Base Button ===== */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-s) var(--space-m);
		border: none;
		border-radius: var(--radius-m);
		font-family: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--transition-fast),
			transform var(--transition-fast), box-shadow var(--transition-fast);
		box-shadow: var(--shadow-sm);
		text-decoration: none;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}

	/* ===== Primary ===== */
	.btn--primary {
		background: var(--color-primary);
		color: white;
	}

	.btn--primary:hover:not(:disabled) {
		background: var(--color-primary-dark);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.btn--primary:active:not(:disabled) {
		transform: translateY(0);
	}

	/* ===== Secondary ===== */
	.btn--secondary {
		background: var(--color-surface-raised);
		color: var(--color-text-main);
		border: 1px solid var(--color-border);
		box-shadow: none;
	}

	.btn--secondary:hover:not(:disabled) {
		background: var(--color-bg-hover);
		border-color: var(--color-primary-muted);
	}

	/* ===== Danger ===== */
	.btn--danger {
		background: var(--color-danger-soft);
		color: var(--color-danger-text);
		box-shadow: none;
	}

	.btn--danger:hover:not(:disabled) {
		background: var(--color-danger-border);
	}

	/* ===== Ghost ===== */
	.btn--ghost {
		background: transparent;
		color: var(--color-text-main);
		box-shadow: none;
	}

	.btn--ghost:hover:not(:disabled) {
		background: var(--color-bg-hover);
	}

	/* ===== Link Style ===== */
	.btn--link {
		background: transparent;
		color: var(--color-primary);
		box-shadow: none;
		padding: var(--space-xs) var(--space-s);
	}

	.btn--link:hover:not(:disabled) {
		background: var(--color-primary-soft);
	}

	/* ===== Icon Button ===== */
	.btn--icon {
		padding: var(--space-xs);
		background: transparent;
		box-shadow: none;
		color: var(--color-text-muted);
		border-radius: var(--radius-s);
	}

	.btn--icon:hover:not(:disabled) {
		background: var(--color-bg-hover);
		color: var(--color-text-main);
		transform: none;
	}

	/* ===== Sizes ===== */
	.btn--sm {
		padding: var(--space-xs) var(--space-s);
		font-size: var(--text-xs);
	}

	.btn--lg {
		padding: var(--space-m) var(--space-l);
		font-size: var(--text-body);
	}

	/* ===== Full Width ===== */
	.btn--full {
		width: 100%;
	}

	/* ===== Legacy aliases (для обратной совместимости) ===== */
	.button {
		/* копируем .btn */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-s) var(--space-m);
		border: none;
		border-radius: var(--radius-m);
		font-family: inherit;
		font-size: var(--text-sm);
		font-weight: 500;
		cursor: pointer;
		transition: background var(--transition-fast),
			transform var(--transition-fast), box-shadow var(--transition-fast);
		box-shadow: var(--shadow-sm);
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.button-primary {
		background: var(--color-primary);
		color: white;
	}
	.button-primary:hover:not(:disabled) {
		background: var(--color-primary-dark);
	}
	.button-secondary {
		background: var(--color-surface-raised);
		color: var(--color-text-main);
		border: 1px solid var(--color-border);
		box-shadow: none;
	}
	.button-secondary:hover:not(:disabled) {
		background: var(--color-bg-hover);
	}
	.button-danger {
		background: var(--color-danger-soft);
		color: var(--color-danger-text);
		box-shadow: none;
	}
	.button-danger:hover:not(:disabled) {
		background: var(--color-danger-border);
	}
`;
