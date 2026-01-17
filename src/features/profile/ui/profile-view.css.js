// src/features/profile/ui/profile-view.css.js
import { css } from 'lit';

export const profileViewStyles = css`
	:host {
		display: block;
		max-width: 800px;
		margin: 0 auto;
	}

	.settings-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-l);
	}

	.error-banner {
		padding: var(--space-s) var(--space-m);
		background: var(--color-danger-soft);
		border: 1px solid var(--color-danger-border);
		border-radius: var(--radius-m);
		color: var(--color-danger-text);
	}

	.loading {
		text-align: center;
		padding: var(--space-xl);
		color: var(--color-text-muted);
	}
`;
