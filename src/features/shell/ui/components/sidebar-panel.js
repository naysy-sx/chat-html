// src/features/shell/ui/components/sidebar-panel.js
import { LitElement, html, css } from 'lit';
import { avatarStyles, buttonStyles } from '../../../../shared/ui/index.js';

export class SidebarPanel extends LitElement {
	static properties = {
		profile: { type: Object },
		username: { type: String },
		currentUserId: { type: String },
		currentScreen: { type: String },
		navigationItems: { type: Array }, // ← НОВОЕ!
	};

	static styles = [
		avatarStyles,
		buttonStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				width: 280px;
				min-width: 280px;
				background: var(--color-surface);
				border-right: 1px solid var(--color-border);
				overflow: hidden;
			}

			/* User Profile Section */
			.user-section {
				padding: var(--space-m);
				border-bottom: 1px solid var(--color-border);
				flex-shrink: 0;
			}

			.user-profile {
				display: flex;
				align-items: center;
				gap: var(--space-s);
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

			/* Navigation Menu */
			.nav-section {
				flex: 1;
				overflow-y: auto;
				padding: var(--space-s) 0;
			}

			.nav-group {
				padding: var(--space-xs) 0;
			}

			.nav-item {
				display: flex;
				align-items: center;
				gap: var(--space-s);
				padding: var(--space-s) var(--space-m);
				color: var(--color-text-main);
				text-decoration: none;
				font-size: var(--text-base);
				cursor: pointer;
				border: none;
				background: none;
				width: 100%;
				text-align: left;
				border-radius: var(--radius-m);
				margin: 0 var(--space-xs);
				width: calc(100% - var(--space-s));
				transition: all var(--transition-fast);
			}

			.nav-item:hover {
				background: var(--color-bg-hover);
			}

			.nav-item.active {
				background: var(--color-primary-soft, rgba(122, 92, 255, 0.1));
				color: var(--color-primary);
				font-weight: 600;
			}

			.nav-item-icon {
				font-size: 1.25rem;
				width: 1.5rem;
				text-align: center;
			}

			.nav-item-label {
				flex: 1;
			}

			/* Logout Button */
			.logout-btn {
				width: calc(100% - var(--space-s));
				margin: var(--space-xs);
			}

			@media (max-width: 768px) {
				:host {
					width: 240px;
					min-width: 240px;
				}
			}
		`,
	];

	constructor() {
		super();
		this.currentScreen = 'messages';
		this.navigationItems = []; // по умолчанию пусто
	}

	get _displayName() {
		return this.profile?.displayName || this.username || 'Пользователь';
	}

	get _bio() {
		return this.profile?.bio || 'Кратко о себе';
	}

	get _avatarLetter() {
		return this._displayName[0]?.toUpperCase() || '?';
	}

	/**
	 * Фильтруем и сортируем пункты меню
	 */
	get _visibleItems() {
		return this.navigationItems
			.filter((item) => item.visible)
			.sort((a, b) => a.order - b.order);
	}

	render() {
		return html`
			<!-- User Profile -->
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
			</div>

			<!-- Navigation Menu -->
			<nav class="nav-section">
				<div class="nav-group">
					${this._visibleItems.map(
						(item) => html`
							<button
								class="nav-item ${this.currentScreen === item.id
									? 'active'
									: ''}"
								@click=${() => this._navigate(item.id)}
							>
								<span class="nav-item-icon">${item.icon}</span>
								<span class="nav-item-label">${item.label}</span>
							</button>
						`
					)}
				</div>
			</nav>

			<!-- Logout Button -->
			<button
				class="btn btn--secondary logout-btn"
				@click=${this._handleLogout}
			>
				🚪 Выйти
			</button>
		`;
	}

	_navigate(screen) {
		this.dispatchEvent(
			new CustomEvent('navigate', {
				detail: { screen },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleLogout() {
		if (confirm('Выйти из аккаунта?')) {
			this.dispatchEvent(
				new CustomEvent('logout', {
					bubbles: true,
					composed: true,
				})
			);
		}
	}
}

customElements.define('sidebar-panel', SidebarPanel);
