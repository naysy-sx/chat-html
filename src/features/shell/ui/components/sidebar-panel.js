// src/features/shell/ui/components/sidebar-panel.js
import { LitElement, html, css } from 'lit';
import { avatarStyles, buttonStyles } from '../../../../shared/ui/index.js';

export class SidebarPanel extends LitElement {
	static properties = {
		profile: { type: Object },
		username: { type: String },
	};

	static styles = [
		avatarStyles,
		buttonStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				width: 250px;
				min-width: 250px;
				background: var(--color-surface);
				border-right: 1px solid var(--color-border);
				overflow: hidden;
			}

			/* User Section */
			.user-section {
				padding: var(--space-m);
				border-bottom: 1px solid var(--color-border);
			}

			.user-profile {
				display: flex;
				align-items: center;
				gap: var(--space-s);
				margin-bottom: var(--space-s);
			}

			.user-info {
				flex: 1;
				min-width: 0;
			}

			.user-name {
				font-weight: 600;
				color: var(--color-text-main);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.user-bio {
				font-size: var(--text-sm);
				color: var(--color-text-muted);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.settings-link {
				display: block;
				padding: var(--space-xs) var(--space-s);
				color: var(--color-primary);
				text-decoration: none;
				font-size: var(--text-sm);
				border-radius: var(--radius-m);
				transition: background var(--transition-fast);
			}

			.settings-link:hover {
				background: var(--color-bg-hover);
			}

			/* Contacts Section */
			.contacts-section {
				flex: 1;
				overflow-y: auto;
				padding: var(--space-s);
			}

			.section-header {
				font-size: var(--text-xs);
				font-weight: 600;
				color: var(--color-text-muted);
				text-transform: uppercase;
				letter-spacing: 0.5px;
				padding: var(--space-xs) var(--space-s);
				margin-bottom: var(--space-xs);
			}

			.empty-state {
				padding: var(--space-m);
				text-align: center;
				color: var(--color-text-muted);
				font-size: var(--text-sm);
			}

			.add-contact-btn {
				width: 100%;
				margin-top: var(--space-s);
			}

			@media (max-width: 768px) {
				:host {
					width: 200px;
					min-width: 200px;
				}
			}
		`,
	];

	get _displayName() {
		return this.profile?.displayName || this.username || 'Пользователь';
	}

	get _bio() {
		return this.profile?.bio || 'Кратко о себе';
	}

	get _avatarLetter() {
		return this._displayName[0]?.toUpperCase() || '?';
	}

	render() {
		return html`
			<!-- User Section -->
			<div class="user-section">
				<div class="user-profile">
					<div class="avatar">
						${this.profile?.avatar
							? html`<img src=${this.profile.avatar} alt="Аватар" />`
							: this._avatarLetter}
					</div>
					<div class="user-info">
						<div class="user-name">${this._displayName}</div>
						<div class="user-bio">${this._bio}</div>
					</div>
				</div>
				<a href="#" class="settings-link" @click=${this._handleSettingsClick}>
					⚙️ Изменить настройки
				</a>
			</div>

			<!-- Contacts Section -->
			<div class="contacts-section">
				<div class="section-header">Контакты</div>
				<div class="empty-state">У вас нет добавленных контактов</div>
				<button
					class="btn btn--primary add-contact-btn"
					@click=${this._handleAddContact}
				>
					➕ Добавить контакт
				</button>
			</div>
		`;
	}

	_handleSettingsClick(e) {
		e.preventDefault();
		this.dispatchEvent(
			new CustomEvent('navigate-settings', {
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleAddContact() {
		this.dispatchEvent(
			new CustomEvent('add-contact', {
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('sidebar-panel', SidebarPanel);
