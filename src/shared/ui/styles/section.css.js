// src/shared/ui/styles/section.css.js
import { css } from 'lit';

/**
 * Стили для секций/карточек
 * Использование: static styles = [sectionStyles, css`...`];
 */
export const sectionStyles = css`
	.section {
		background: var(--color-surface);
		border-radius: var(--radius-l);
		padding: var(--space-l);
		box-shadow: var(--shadow-card);
	}

	.section-header {
		margin: 0 0 var(--space-m) 0;
	}

	.section-title {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--color-text-main);
		line-height: var(--line-tight);
	}

	.section-subtitle {
		margin: var(--space-xs) 0 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.section-divider {
		margin: var(--space-l) 0;
		padding-top: var(--space-l);
		border-top: 1px solid var(--color-border);
	}

	.subsection-title {
		margin: 0 0 var(--space-m) 0;
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text-main);
	}

	/* Вариант: выделенная секция */
	.section--highlighted {
		border: 2px dashed var(--color-primary);
		background: var(--color-primary-soft);
	}

	.section--highlighted .section-title {
		color: var(--color-primary);
	}
`;
