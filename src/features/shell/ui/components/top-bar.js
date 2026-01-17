// src/features/shell/ui/components/top-bar.js
import { LitElement, html, css } from 'lit';

export class TopBar extends LitElement {
	static properties = {
		currentScreen: { type: String },
		activeContact: { type: Object },
	};

	static styles = css`
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

		.contact-info {
			display: flex;
			align-items: center;
			gap: var(--space-s);
		}

		.back-btn {
			background: none;
			border: none;
			color: var(--color-primary);
			cursor: pointer;
			font-size: var(--text-lg);
			padding: var(--space-xs);
			display: none;
		}

		@media (max-width: 768px) {
			.back-btn {
				display: block;
			}
		}
	`;

	static TITLES = {
		messages: '💬 Сообщения',
		contacts: '👥 Контакты',
		journal: '📝 Журнал',
		discovery: '🌐 Обзор',
		settings: '⚙️ Настройки',
		profile: '👤 Профиль',
		files: '📁 Файлы',
		chat: '💬 Чат',
	};

	render() {
		const title = this._getTitle();

		return html`
			<div class="top-bar">
				<div class="contact-info">
					${this.currentScreen === 'chat'
						? html`
								<button class="back-btn" @click=${this._handleBack}>←</button>
						  `
						: ''}
					<h1 class="screen-title">${title}</h1>
				</div>
			</div>
		`;
	}

	_getTitle() {
		if (this.currentScreen === 'chat' && this.activeContact) {
			return this.activeContact.name || this.activeContact.username || 'Чат';
		}
		return TopBar.TITLES[this.currentScreen] || 'Chat App';
	}

	_handleBack() {
		this.dispatchEvent(
			new CustomEvent('back', {
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('top-bar', TopBar);
