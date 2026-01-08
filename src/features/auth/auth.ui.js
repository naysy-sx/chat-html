// src/features/auth/auth.ui.js

import { LitElement, html, css } from 'lit';

// ============================================================
// AUTH SCREEN — главный компонент
// ============================================================

export class AuthScreen extends LitElement {
	static properties = {
		actor: { type: Object },
		state: { type: String },
		error: { type: String },
		availableUsers: { type: Array },

		// ⭐ ДОБАВИТЬ ЭТИ ТРИ СВОЙСТВА:
		mode: { type: String },
		username: { type: String },
		password: { type: String },
	};

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: var(--space-m);
			font-family: var(--font-ui);
		}

		.card {
			background: var(--color-surface);
			border-radius: var(--radius-xl);
			padding: var(--space-xl);
			box-shadow: var(--shadow-lg);
			width: 100%;
			max-width: 400px;
		}

		h1 {
			margin: 0 0 var(--space-l) 0;
			font-size: var(--text-xl);
			text-align: center;
			color: var(--color-text-main);
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
			color: var(--color-text-main);
			transition: background var(--transition-fast),
				color var(--transition-fast), box-shadow var(--transition-fast);
			box-shadow: none;
		}

		.tab.active {
			background: var(--color-primary);
			color: white;
		}

		.tab:not(.active):hover {
			background: var(--color-bg-hover);
		}

		.form-group {
			margin-bottom: var(--space-m);
		}

		label {
			display: block;
			margin-bottom: var(--space-xs);
			font-weight: 500;
			font-size: var(--text-sm);
			color: var(--color-text-muted);
		}

		input {
			width: 100%;
			padding: var(--space-s) var(--space-m);
			border: 2px solid var(--border-subtle);
			border-radius: var(--radius-m);
			font-size: var(--text-body);
			background: var(--color-bg);
			color: var(--color-text-main);
			transition: border-color var(--transition-fast),
				box-shadow var(--transition-fast);
			box-sizing: border-box;
		}

		input:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px var(--color-primary-soft);
		}

		.error {
			background: var(--color-danger-soft);
			color: var(--color-danger-text);
			padding: var(--space-s) var(--space-m);
			border-radius: var(--radius-m);
			margin-bottom: var(--space-m);
			text-align: center;
			font-size: var(--text-sm);
		}

		button[type='submit'] {
			width: 100%;
			padding: var(--space-m);
			border: none;
			background: var(--color-primary);
			color: white;
			border-radius: var(--radius-m);
			font-size: var(--text-body);
			font-weight: 600;
			cursor: pointer;
			transition: background var(--transition-fast),
				transform var(--transition-fast), opacity var(--transition-fast);
			box-shadow: var(--shadow-sm);
		}

		button[type='submit']:hover {
			background: var(--color-primary-dark);
			transform: translateY(-1px);
			box-shadow: var(--shadow-md);
		}

		button[type='submit']:active {
			transform: scale(0.98);
		}

		button[type='submit']:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}

		.users-list {
			margin-top: var(--space-l);
			padding-top: var(--space-l);
			border-top: 1px solid var(--border-subtle);
		}

		.users-list h3 {
			margin: 0 0 var(--space-s) 0;
			font-size: var(--text-sm);
			color: var(--color-text-muted);
			font-weight: 500;
		}

		.user-chip {
			display: inline-block;
			padding: var(--space-xs) var(--space-s);
			background: var(--color-surface-raised);
			border-radius: var(--radius-s);
			margin: 0 var(--space-2xs) var(--space-2xs) 0;
			font-size: var(--text-sm);
			cursor: pointer;
			transition: background var(--transition-fast);
		}

		.user-chip:hover {
			background: var(--color-bg-hover);
		}

		.loading {
			text-align: center;
			padding: var(--space-xl);
			color: var(--color-text-muted);
		}

		.spinner {
			display: inline-block;
			width: 24px;
			height: 24px;
			border: 3px solid var(--color-surface-raised);
			border-top-color: var(--color-primary);
			border-radius: var(--radius-full);
			animation: spin 0.8s linear infinite;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	`;

	constructor() {
		super();
		this.mode = 'login';
		this.username = '';
		this.password = '';
		this._subscription = null;
	}

	connectedCallback() {
		super.connectedCallback();

		if (this.actor) {
			this._subscription = this.actor.subscribe((snapshot) => {
				this.state = snapshot.value;
				this.error = snapshot.context.error;
				this.availableUsers = snapshot.context.availableUsers || [];
			});

			// Initial state
			const snapshot = this.actor.getSnapshot();
			this.state = snapshot.value;
			this.error = snapshot.context.error;
			this.availableUsers = snapshot.context.availableUsers || [];
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._subscription?.unsubscribe();
	}

	render() {
		if (this.state === 'initializing') {
			return html`
				<div class="card">
					<div class="loading">
						<div class="spinner"></div>
						<p>Загрузка...</p>
					</div>
				</div>
			`;
		}

		if (this.state === 'loggingIn' || this.state === 'registering') {
			return html`
				<div class="card">
					<div class="loading">
						<div class="spinner"></div>
						<p>${this.state === 'loggingIn' ? 'Вход...' : 'Регистрация...'}</p>
					</div>
				</div>
			`;
		}

		return html`
			<div class="card">
				<h1>🔐 Вход</h1>

				<div class="tabs">
					<button
						class="tab ${this.mode === 'login' ? 'active' : ''}"
						@click=${this._setModeLogin}
					>
						Войти
					</button>
					<button
						class="tab ${this.mode === 'register' ? 'active' : ''}"
						@click=${this._setModeRegister}
					>
						Регистрация
					</button>
				</div>

				${this.error ? html`<div class="error">⚠️ ${this.error}</div>` : ''}

				<form @submit=${this._handleSubmit}>
					<div class="form-group">
						<label for="username">Имя пользователя</label>
						<input
							id="username"
							type="text"
							.value=${this.username}
							@input=${this._onUsernameInput}
							placeholder="Введите имя"
							autocomplete="username"
							required
						/>
					</div>

					<div class="form-group">
						<label for="password">Пароль</label>
						<input
							id="password"
							type="password"
							.value=${this.password}
							@input=${this._onPasswordInput}
							placeholder="Введите пароль"
							autocomplete=${this.mode === 'register'
								? 'new-password'
								: 'current-password'}
							required
						/>
					</div>

					<button type="submit">
						${this.mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
					</button>
				</form>

				${this.availableUsers.length > 0
					? html`
							<div class="users-list">
								<h3>Существующие пользователи:</h3>
								${this.availableUsers.map(
									(user) => html`
										<span
											class="user-chip"
											@click=${() => this._selectUser(user.username)}
										>
											${user.username}
										</span>
									`
								)}
							</div>
					  `
					: ''}
			</div>
		`;
	}

	// ⭐ Отдельные методы для переключения вкладок
	_setModeLogin() {
		this.mode = 'login';
	}

	_setModeRegister() {
		this.mode = 'register';
	}

	// ⭐ Отдельные методы для input
	_onUsernameInput(e) {
		this.username = e.target.value;
	}

	_onPasswordInput(e) {
		this.password = e.target.value;
	}

	_handleSubmit(e) {
		e.preventDefault();

		if (!this.username.trim() || !this.password) {
			return;
		}

		const eventType = this.mode === 'login' ? 'LOGIN' : 'REGISTER';

		this.actor.send({
			type: eventType,
			username: this.username.trim(),
			password: this.password,
		});

		// Очищаем пароль после отправки
		this.password = '';
	}

	_selectUser(username) {
		this.username = username;
		this.mode = 'login';

		// Фокус на поле пароля
		this.updateComplete.then(() => {
			this.shadowRoot.getElementById('password')?.focus();
		});
	}
}

customElements.define('auth-screen', AuthScreen);

// ============================================================
// PROFILE SCREEN — экран профиля (без изменений)
// ============================================================

export class ProfileScreen extends LitElement {
	static properties = {
		actor: { type: Object },
		username: { type: String },
		showDeleteConfirm: { type: Boolean }, // ⭐ тоже добавить!
	};

	static styles = css`
		:host {
			display: block;
			padding: var(--space-m, 1rem);
		}

		.profile-header {
			display: flex;
			align-items: center;
			gap: var(--space-m, 1rem);
			margin-bottom: var(--space-xl, 2rem);
		}

		.avatar {
			width: 64px;
			height: 64px;
			background: var(--color-primary, #6366f1);
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.5rem;
			color: white;
		}

		.user-info h2 {
			margin: 0;
			font-size: 1.25rem;
		}

		.user-info p {
			margin: var(--space-xs, 0.25rem) 0 0;
			color: var(--color-text-muted, #666);
		}

		.actions {
			display: flex;
			flex-direction: column;
			gap: var(--space-s, 0.75rem);
		}

		button {
			padding: var(--space-m, 1rem);
			border: none;
			border-radius: var(--radius-m, 8px);
			font-size: 1rem;
			cursor: pointer;
			transition: opacity 0.2s;
		}

		button:hover {
			opacity: 0.9;
		}

		.btn-logout {
			background: var(--color-bg, #f0f0f0);
			color: var(--color-text-main, #333);
		}

		.btn-delete {
			background: oklch(92% 0.08 27);
			color: oklch(45% 0.2 27);
		}

		.confirm-dialog {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: var(--space-m, 1rem);
		}

		.confirm-content {
			background: var(--color-surface, white);
			padding: var(--space-xl, 2rem);
			border-radius: var(--radius-l, 16px);
			max-width: 400px;
			width: 100%;
		}

		.confirm-content h3 {
			margin: 0 0 var(--space-m, 1rem) 0;
		}

		.confirm-content p {
			color: var(--color-text-muted, #666);
			margin-bottom: var(--space-l, 1.5rem);
		}

		.confirm-buttons {
			display: flex;
			gap: var(--space-s, 0.75rem);
		}

		.confirm-buttons button {
			flex: 1;
		}

		.btn-cancel {
			background: var(--color-bg, #f0f0f0);
			color: var(--color-text-main, #333);
		}

		.btn-confirm-delete {
			background: oklch(58% 0.22 27);
			color: white;
		}
	`;

	constructor() {
		super();
		this.showDeleteConfirm = false;
	}

	render() {
		return html`
			<div class="profile-header">
				<div class="avatar">${this.username?.[0]?.toUpperCase() || '?'}</div>
				<div class="user-info">
					<h2>${this.username}</h2>
					<p>Вы вошли в систему</p>
				</div>
			</div>

			<div class="actions">
				<button class="btn-logout" @click=${this._logout}>🚪 Выйти</button>

				<button class="btn-delete" @click=${this._showConfirm}>
					🗑️ Удалить аккаунт
				</button>
			</div>

			${this.showDeleteConfirm
				? html`
						<div class="confirm-dialog" @click=${this._closeDialog}>
							<div class="confirm-content" @click=${(e) => e.stopPropagation()}>
								<h3>⚠️ Удалить аккаунт?</h3>
								<p>
									Это действие нельзя отменить. Все ваши данные, включая
									сообщения и настройки, будут удалены.
								</p>
								<div class="confirm-buttons">
									<button class="btn-cancel" @click=${this._closeDialog}>
										Отмена
									</button>
									<button
										class="btn-confirm-delete"
										@click=${this._deleteAccount}
									>
										Удалить
									</button>
								</div>
							</div>
						</div>
				  `
				: ''}
		`;
	}

	_logout() {
		this.actor?.send({ type: 'LOGOUT' });
	}

	_showConfirm() {
		this.showDeleteConfirm = true;
	}

	_deleteAccount() {
		this.actor?.send({ type: 'DELETE_ACCOUNT' });
		this.showDeleteConfirm = false;
	}

	_closeDialog() {
		this.showDeleteConfirm = false;
	}
}

customElements.define('profile-screen', ProfileScreen);
