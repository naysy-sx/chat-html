// src/features/shell/ui/app-shell.css.js
import { css } from 'lit';

export const appShellStyles = css`
	:host {
		display: block;
		height: 100dvh;
		background: var(--color-bg);
	}

	.app-container {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.content-area {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-l);
	}

	@media (max-width: 768px) {
		.content-area {
			padding: var(--space-m);
		}
	}
`;
