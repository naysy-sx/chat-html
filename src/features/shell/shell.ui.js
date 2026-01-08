// src/features/shell/shell.ui.js

import { LitElement, html, css } from 'lit';
import { eventBus } from '../../core/event-bus.js';

export class AppShell extends LitElement {
	static properties = {
		authActor: { type: Object },
		shellActor: { type: Object },
		featureRegistry: { type: Object },

		// Внутреннее состояние
		_authState: { type: String, state: true },
		_shellState: { type: String, state: true },
		_username: { type: String, state: true },
		_currentScreen: { type: String, state: true },
		_activeContactId: { type: String, state: true },

		// Данные профиля из settings
		_profile: { type: Object, state: true },
	};

	static styles = css`
		:host {
			display: block;
			height: 100dvh;
			background: var(--color-bg, #f0f2f5);
		}
		/* ... стили без изменений ... */
		.auth-wrapper {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100dvh;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		}
		.app-container {
			display: flex;
			height: 100dvh;
			overflow: hidden;
		}
		.aside {
			width: 250px;
			min-width: 250px;
			background: var(--color-surface, white);
			border-right: 1px solid var(--border-color, #e0e0e0);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		.user-section {
			padding: var(--space-m, 1rem);
			border-bottom: 1px solid var(--border-color, #e0e0e0);
		}
		.user-profile {
			display: flex;
			align-items: center;
			gap: var(--space-s, 0.75rem);
			margin-bottom: var(--space-s, 0.75rem);
		}
		.user-avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: var(--color-primary, #6366f1);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: 600;
			font-size: 1.1rem;
			object-fit: cover;
		}
		.user-avatar img {
			width: 100%;
			height: 100%;
			border-radius: 50%;
		}
		.user-info {
			flex: 1;
			min-width: 0;
		}
		.user-name {
			font-weight: 600;
			color: var(--color-text-main, #333);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.user-bio {
			font-size: 0.85rem;
			color: var(--color-text-muted, #666);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.settings-link {
			display: block;
			padding: var(--space-xs, 0.5rem) var(--space-s, 0.75rem);
			color: var(--color-primary, #6366f1);
			text-decoration: none;
			font-size: 0.9rem;
			border-radius: var(--radius-m, 8px);
			transition: background 0.2s;
		}
		.settings-link:hover {
			background: var(--color-bg, #f0f2f5);
		}
		.contacts-section {
			flex: 1;
			overflow-y: auto;
			padding: var(--space-s, 0.75rem);
		}
		.section-header {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--color-text-muted, #666);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			padding: var(--space-xs, 0.5rem) var(--space-s, 0.75rem);
			margin-bottom: var(--space-xs, 0.5rem);
		}
		.empty-state {
			padding: var(--space-m, 1rem);
			text-align: center;
			color: var(--color-text-muted, #666);
			font-size: 0.9rem;
		}
		.add-contact-btn {
			width: 100%;
			padding: var(--space-s, 0.75rem);
			background: var(--color-primary, #6366f1);
			color: white;
			border: none;
			border-radius: var(--radius-m, 8px);
			font-weight: 500;
			cursor: pointer;
			margin-top: var(--space-s, 0.75rem);
			transition: background 0.2s;
		}
		.add-contact-btn:hover {
			background: var(--color-primary-dark, #4f46e5);
		}
		.main-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		.top-bar {
			padding: var(--space-m, 1rem) var(--space-l, 1.5rem);
			background: var(--color-surface, white);
			border-bottom: 1px solid var(--border-color, #e0e0e0);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		.screen-title {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color-text-main, #333);
			margin: 0;
		}
		.logout-btn {
			padding: var(--space-xs, 0.5rem) var(--space-m, 1rem);
			background: transparent;
			border: 1px solid var(--border-color, #e0e0e0);
			border-radius: var(--radius-m, 8px);
			cursor: pointer;
			transition: all 0.2s;
		}
		.logout-btn:hover {
			background: var(--color-bg, #f0f2f5);
		}
		.content-area {
			flex: 1;
			overflow-y: auto;
			padding: var(--space-l, 1.5rem);
		}
		.loading {
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--color-bg, #f0f2f5);
		}
		.spinner {
			width: 40px;
			height: 40px;
			border: 4px solid var(--color-bg, #e0e0e0);
			border-top-color: var(--color-primary, #6366f1);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
		@media (max-width: 768px) {
			.aside {
				width: 200px;
				min-width: 200px;
			}
			.content-area {
				padding: var(--space-m, 1rem);
			}
		}
	`;

	constructor() {
		super();
		this._authState = 'initializing';
		this._shellState = 'loading';
		this._username = null;
		this._currentScreen = 'settings';
		this._activeContactId = null;
		this._profile = null;
		this._settingsActor = null;
		this._authSubscription = null;
		this._shellSubscription = null;
		this._settingsSubscription = null;
		this._onSettingsReady = this._onSettingsReady.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		this._subscribeToActors();
		eventBus.on('SETTINGS_READY', this._onSettingsReady);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._authSubscription?.unsubscribe();
		this._shellSubscription?.unsubscribe();
		this._settingsSubscription?.unsubscribe();
		eventBus.off('SETTINGS_READY', this._onSettingsReady);
	}

	updated(changedProperties) {
		if (
			(changedProperties.has('authActor') ||
				changedProperties.has('shellActor')) &&
			this.authActor &&
			this.shellActor
		) {
			this._subscribeToActors();
		}
	}

	_onSettingsReady(event) {
		const actor = event.actor;
		if (actor) {
			console.log('🐚 EventBus notified: Settings are ready');
			this._connectToSettingsActor(actor);
		}
	}

	_subscribeToActors() {
		if (this.authActor) {
			this._authSubscription?.unsubscribe();
			const authSnapshot = this.authActor.getSnapshot();
			this._authState = authSnapshot.value;
			this._username = authSnapshot.context.username;
			this._authSubscription = this.authActor.subscribe((snapshot) => {
				this._authState = snapshot.value;
				this._username = snapshot.context.username;
			});
		}
		if (this.shellActor) {
			this._shellSubscription?.unsubscribe();
			const shellSnapshot = this.shellActor.getSnapshot();
			this._updateFromShellSnapshot(shellSnapshot);
			this._shellSubscription = this.shellActor.subscribe((snapshot) => {
				this._updateFromShellSnapshot(snapshot);
			});
		}
		// Убрали лишний код, который пытался читать из реестра через getMountResult
		this._tryConnectInitialSettings();
	}

	_updateFromShellSnapshot(snapshot) {
		let state = snapshot.value;
		if (typeof state === 'object' && state.authenticated) {
			state = `authenticated.${state.authenticated}`;
		}
		this._shellState = state;
		this._currentScreen = snapshot.context.currentScreen;
		this._activeContactId = snapshot.context.activeContactId;
	}

	_tryConnectInitialSettings() {
		if (this._settingsActor) return;
		// Этот фоллбэк нужен на случай, если мы перезагрузили страницу и уже залогинены,
		// но лучше полагаться на EventBus или ActorRegistry напрямую, а не MountResult
		const settingsResult = this.featureRegistry?.getMountResult('settings');
		if (settingsResult?.actor) {
			this._connectToSettingsActor(settingsResult.actor);
		}
	}

	_connectToSettingsActor(actor) {
		if (this._settingsActor === actor) return;
		this._settingsActor = actor;
		this._settingsSubscription?.unsubscribe();
		const snapshot = actor.getSnapshot();
		this._profile = snapshot.context.profile;
		this._settingsSubscription = actor.subscribe((snapshot) => {
			this._profile = snapshot.context.profile;
			this.requestUpdate();
		});
		this.requestUpdate();
	}

	render() {
		if (this._authState === 'initializing' || this._shellState === 'loading') {
			return this._renderLoading();
		}
		if (
			this._authState === 'guest' ||
			this._authState === 'loggingIn' ||
			this._authState === 'registering'
		) {
			return this._renderAuthScreen();
		}
		if (this._authState === 'authenticated') {
			return this._renderApp();
		}
		return this._renderLoading();
	}

	_renderLoading(message = 'Загрузка...') {
		return html`
			<div class="loading">
				<div style="text-align: center;">
					<div class="spinner"></div>
					<p style="margin-top: 1rem; color: var(--color-text-muted, #666);">
						${message}
					</p>
				</div>
			</div>
		`;
	}

	_renderAuthScreen() {
		return html`
			<div class="auth-wrapper">
				<auth-screen .actor=${this.authActor}></auth-screen>
			</div>
		`;
	}

	_renderApp() {
		return html`
			<div class="app-container">
				${this._renderAside()}
				<div class="main-content">
					${this._renderTopBar()}
					<div class="content-area">${this._renderContent()}</div>
				</div>
			</div>
		`;
	}

	_renderAside() {
		const displayName =
			this._profile?.displayName || this._username || 'Пользователь';
		const bio = this._profile?.bio || 'Кратко о себе';
		const avatar = this._profile?.avatar;

		return html`
			<aside class="aside">
				<div class="user-section">
					<div class="user-profile">
						<div class="user-avatar">
							${avatar
								? html`<img src=${avatar} alt="Аватар" />`
								: html`${displayName[0]?.toUpperCase() || '?'}`}
						</div>
						<div class="user-info">
							<div class="user-name">${displayName}</div>
							<div class="user-bio">${bio}</div>
						</div>
					</div>
					<a
						href="#"
						class="settings-link"
						@click=${this._handleNavigateToSettings}
					>
						⚙️ Изменить настройки
					</a>
				</div>
				<div class="contacts-section">
					<div class="section-header">Контакты</div>
					<div class="empty-state">У вас нет добавленных контактов</div>
					<button class="add-contact-btn" @click=${this._handleAddContact}>
						➕ Добавить контакт
					</button>
				</div>
			</aside>
		`;
	}

	_renderTopBar() {
		const titles = {
			settings: 'Настройки',
			contactsList: 'Контакты',
			chat: 'Чат',
		};
		return html`
			<div class="top-bar">
				<h1 class="screen-title">
					${titles[this._currentScreen] || 'Chat App'}
				</h1>
				<button class="logout-btn" @click=${this._handleLogout}>Выйти</button>
			</div>
		`;
	}

	_renderContent() {
		switch (this._currentScreen) {
			case 'settings':
				return this._renderSettings();
			case 'contactsList':
				return this._renderContactsList();
			case 'chat':
				return this._renderChat();
			default:
				return html`<div>Экран не найден</div>`;
		}
	}

	// === ВОТ ЗДЕСЬ БЫЛА ОШИБКА ===
	_renderSettings() {
		import('../settings/settings.ui.js');

		// Используем this._settingsActor, который мы получили через EventBus
		if (!this._settingsActor) {
			return this._renderLoading('Загрузка профиля...');
		}

		// Мы удалили проверку реестра, так как реестр может быть "пустым" в ленивом режиме,
		// а this._settingsActor у нас точно есть.
		return html`
			<settings-view .settingsActor=${this._settingsActor}></settings-view>
		`;
	}
	// ===============================

	_renderContactsList() {
		return html`
			<div
				style="padding: 2rem; text-align: center; color: var(--color-text-muted);"
			>
				<h3>Список контактов</h3>
				<p>Здесь будут отображаться ваши контакты</p>
			</div>
		`;
	}

	_renderChat() {
		return html`
			<div
				style="padding: 2rem; text-align: center; color: var(--color-text-muted);"
			>
				<h3>Чат с контактом</h3>
				<p>Contact ID: ${this._activeContactId}</p>
			</div>
		`;
	}

	_handleNavigateToSettings(e) {
		e.preventDefault();
		this.shellActor?.send({ type: 'NAVIGATE_TO_SETTINGS' });
	}

	_handleAddContact() {
		alert('Добавление контакта - скоро будет реализовано!');
	}

	_handleLogout() {
		if (confirm('Выйти из аккаунта?')) {
			this.authActor?.send({ type: 'LOGOUT' });
		}
	}
}

customElements.define('app-shell', AppShell);
