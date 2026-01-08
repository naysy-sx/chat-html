// src/features/auth/ui/auth-screen.css.js
import { css } from 'lit';

export const authScreenStyles = css`
	:host {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-m);
		font-family: var(--font-ui);
	}

	.card {
		background: var(--color-surface);
		border-radius: var(--radius-xl);
		padding: var(--space-xl);
		box-shadow: var(--shadow-lg);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		margin: 0 0 var(--space-l) 0;
		font-size: var(--text-xl);
		text-align: center;
		color: var(--color-text-main);
	}

	.error {
		background: var(--color-danger-soft);
		color: var(--color-danger-text);
		padding: var(--space-s) var(--space-m);
		border-radius: var(--radius-m);
		margin-bottom: var(--space-m);
		text-align: center;
		font-size: var(--text-sm);
	}
`;
