// src/shared/ui/styles/avatar.css.js
import { css } from 'lit';

/**
 * Стили аватаров
 */
export const avatarStyles = css`
	.avatar {
		width: var(--avatar-size, 48px);
		height: var(--avatar-size, 48px);
		border-radius: var(--radius-full);
		background: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: calc(var(--avatar-size, 48px) * 0.4);
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar--sm {
		--avatar-size: 32px;
	}

	.avatar--lg {
		--avatar-size: 64px;
	}

	.avatar--xl {
		--avatar-size: 80px;
	}
`;
