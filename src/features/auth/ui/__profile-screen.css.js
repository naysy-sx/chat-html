// src/features/auth/ui/profile-screen.css.js
import { css } from 'lit';

export const profileScreenStyles = css`
	:host {
		display: block;
		padding: var(--space-m);
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: var(--space-m);
		margin-bottom: var(--space-xl);
	}

	.avatar {
		width: var(--avatar-size-lg);
		height: var(--avatar-size-lg);
		background: var(--color-primary);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-xl);
		color: var(--color-white);
		font-weight: 600;
	}

	.user-info h2 {
		margin: 0;
		font-size: var(--text-xl);
		color: var(--color-text-main);
	}

	.user-info p {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-s);
	}

	/* Dialog Overlay */
	.confirm-dialog {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-m);
		z-index: var(--z-modal);
	}

	.confirm-content {
		background: var(--color-surface);
		padding: var(--space-xl);
		border-radius: var(--radius-l);
		max-width: 400px;
		width: 100%;
		box-shadow: var(--shadow-lg);
	}

	.confirm-content h3 {
		margin: 0 0 var(--space-m) 0;
		color: var(--color-text-main);
	}

	.confirm-content p {
		color: var(--color-text-muted);
		margin-bottom: var(--space-l);
		line-height: var(--line-normal);
	}

	.confirm-buttons {
		display: flex;
		gap: var(--space-s);
	}

	.confirm-buttons button {
		flex: 1;
	}
`;
