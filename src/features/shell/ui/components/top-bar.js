// src/features/shell/ui/components/top-bar.js
import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../../../../shared/ui/index.js';

export class TopBar extends LitElement {
	static properties = {
		currentScreen: { type: String },
	};

	static styles = [
		buttonStyles,
		css`
			:host {
				display: block;
			}

			.top-bar {
				padding: var(--space-m) var(--space-l);
				background: var(--color-surface);
				border-bottom: 1px solid var(--color-border);
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.screen-title {
				font-size: var(--text-xl);
				font-weight: 600;
				color: var(--color-text-main);
				margin: 0;
			}
		`,
	];

	static TITLES = {
		settings: 'Настройки',
		contactsList: 'Контакты',
		chat: 'Чат',
	};

	render() {
		const title = TopBar.TITLES[this.currentScreen] || 'Chat App';

		return html`
			<div class="top-bar">
				<h1 class="screen-title">${title}</h1>
				<button class="btn btn--secondary" @click=${this._handleLogout}>
					Выйти
				</button>
			</div>
		`;
	}

	_handleLogout() {
		if (confirm('Выйти из аккаунта?')) {
			this.dispatchEvent(
				new CustomEvent('logout', { bubbles: true, composed: true })
			);
		}
	}
}

customElements.define('top-bar', TopBar);
