// src/features/contacts/ui/contacts-view.css.js

import { css } from 'lit';

export const contactsViewStyles = css`
	:host {
		display: flex;
		height: 100%;
		overflow: hidden;
	}

	.contacts-sidebar {
		width: 320px;
		min-width: 280px;
		max-width: 400px;
		background: var(--color-surface-raised, var(--color-surface));
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.sidebar-header {
		padding: var(--space-4);
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-3);
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--color-primary, #7a5cff);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.9375rem;
		margin-bottom: var(--space-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-bio {
		font-size: 0.8125rem;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.6));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.settings-link {
		color: var(--color-primary, #7a5cff);
		text-decoration: none;
		font-size: 0.8125rem;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		transition: opacity 0.2s;
	}

	.settings-link:hover {
		opacity: 0.8;
	}

	.add-contact-btn {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: var(--color-primary, #7a5cff);
		color: var(--color-white, #fff);
		border: none;
		border-radius: var(--radius-m);
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 0.875rem;
	}

	.add-contact-btn:hover {
		background: var(--color-primary-dark, var(--color-primary));
	}

	.contacts-list {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.group-section {
		margin-bottom: var(--space-2);
	}

	.group-header {
		padding: var(--space-2) var(--space-4);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary, var(--color-text-muted));
		background: var(--color-surface-raised, var(--color-surface));
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.empty-state {
		padding: var(--space-6) var(--space-4);
		text-align: center;
		color: var(--color-text-muted, rgba(0, 0, 0, 0.6));
		font-size: 0.875rem;
	}

	.empty-state-icon {
		font-size: 3rem;
		margin-bottom: var(--space-3);
		opacity: 0.3;
	}

	/* Главный контент */
	.contacts-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg, var(--color-surface));
	}

	.content-placeholder {
		text-align: center;
		color: var(--text-secondary);
		max-width: 400px;
		padding: var(--space-6);
	}

	.content-placeholder-icon {
		font-size: 4rem;
		margin-bottom: var(--space-4);
		opacity: 0.2;
	}

	.content-placeholder h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: var(--space-2);
		color: var(--color-text-main, rgba(0, 0, 0, 0.9));
	}

	.content-placeholder p {
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	/* Адаптив */
	@media (max-width: 768px) {
		.contacts-sidebar {
			width: 100%;
			max-width: none;
		}

		.contacts-content {
			display: none;
		}
	}
`;
