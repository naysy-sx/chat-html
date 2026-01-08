// src/features/auth/ui/components/auth-tabs.js
import { LitElement, html, css } from 'lit';

export class AuthTabs extends LitElement {
	static properties = {
		mode: { type: String }, // 'login' | 'register'
	};

	static styles = css`
		:host {
			display: block;
		}

		.tabs {
			display: flex;
			gap: var(--space-xs);
			margin-bottom: var(--space-l);
		}

		.tab {
			flex: 1;
			padding: var(--space-s);
			border: none;
			background: var(--color-surface-raised);
			border-radius: var(--radius-m);
			cursor: pointer;
			font-weight: 500;
			font-family: inherit;
			font-size: var(--text-body);
			color: var(--color-text-main);
			transition: background var(--transition-fast),
				color var(--transition-fast);
		}

		.tab.active {
			background: var(--color-primary);
			color: white;
		}

		.tab:not(.active):hover {
			background: var(--color-bg-hover);
		}
	`;

	constructor() {
		super();
		this.mode = 'login';
	}

	render() {
		return html`
			<div class="tabs">
				<button
					class="tab ${this.mode === 'login' ? 'active' : ''}"
					@click=${() => this._setMode('login')}
				>
					Войти
				</button>
				<button
					class="tab ${this.mode === 'register' ? 'active' : ''}"
					@click=${() => this._setMode('register')}
				>
					Регистрация
				</button>
			</div>
		`;
	}

	_setMode(mode) {
		this.dispatchEvent(
			new CustomEvent('mode-change', {
				detail: { mode },
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('auth-tabs', AuthTabs);
