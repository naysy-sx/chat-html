// src/shared/ui/styles/layout.css.js
import { css } from 'lit';

/**
 * Общие layout-стили
 */
export const layoutStyles = css`
	/* ===== Flex helpers ===== */
	.flex {
		display: flex;
	}

	.flex-col {
		flex-direction: column;
	}

	.flex-center {
		align-items: center;
		justify-content: center;
	}

	.flex-between {
		justify-content: space-between;
	}

	.flex-1 {
		flex: 1;
	}

	.gap-xs {
		gap: var(--space-xs);
	}
	.gap-s {
		gap: var(--space-s);
	}
	.gap-m {
		gap: var(--space-m);
	}
	.gap-l {
		gap: var(--space-l);
	}

	/* ===== Common states ===== */
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		color: var(--color-text-muted);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-text-muted);
	}

	/* ===== Spinner ===== */
	.spinner {
		width: var(--spinner-size, 40px);
		height: var(--spinner-size, 40px);
		border: 4px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ===== Messages ===== */
	.error-message {
		padding: var(--space-s) var(--space-m);
		background: var(--color-danger-soft);
		border: 1px solid var(--color-danger-border);
		border-radius: var(--radius-m);
		color: var(--color-danger-text);
	}

	.success-message {
		padding: var(--space-s) var(--space-m);
		background: var(--color-success-soft);
		border: 1px solid var(--color-success);
		border-radius: var(--radius-m);
		color: var(--color-text-main);
	}
`;
