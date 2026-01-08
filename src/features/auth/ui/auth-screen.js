// src/features/auth/ui/auth-screen.js
import { LitElement, html } from 'lit';
import { authScreenStyles } from './auth-screen.css.js';

// Импортируем компоненты
import './components/auth-loading.js';
import './components/auth-tabs.js';
import './components/auth-form.js';
import './components/users-list.js';

export class AuthScreen extends LitElement {
	static properties = {
		actor: { type: Object },

		_state: { state: true },
		_error: { state: true },
		_availableUsers: { state: true },
		_mode: { state: true },
		_username: { state: true },
		_password: { state: true },
	};

	static styles = authScreenStyles;

	constructor() {
		super();
		this._state = 'initializing';
		this._error = null;
		this._availableUsers = [];
		this._mode = 'login';
		this._username = '';
		this._password = '';
		this._subscription = null;
	}

	connectedCallback() {
		super.connectedCallback();
		this._subscribe();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._subscription?.unsubscribe();
	}

	updated(changedProperties) {
		if (changedProperties.has('actor') && this.actor) {
			this._subscribe();
		}
	}

	_subscribe() {
		if (!this.actor) return;

		this._subscription?.unsubscribe();

		const sync = (snapshot) => {
			this._state = snapshot.value;
			this._error = snapshot.context.error;
			this._availableUsers = snapshot.context.availableUsers || [];
		};

		sync(this.actor.getSnapshot());
		this._subscription = this.actor.subscribe(sync);
	}

	render() {
		// Loading states
		if (this._state === 'initializing') {
			return this._renderCard(html`
				<auth-loading message="Загрузка..."></auth-loading>
			`);
		}

		if (this._state === 'loggingIn' || this._state === 'registering') {
			const message =
				this._state === 'loggingIn' ? 'Вход...' : 'Регистрация...';
			return this._renderCard(html`
				<auth-loading message=${message}></auth-loading>
			`);
		}

		// Main form
		return this._renderCard(html`
			<h1>🔐 Вход</h1>

			<auth-tabs
				.mode=${this._mode}
				@mode-change=${this._handleModeChange}
			></auth-tabs>

			${this._error ? html`<div class="error">⚠️ ${this._error}</div>` : ''}

			<auth-form
				.mode=${this._mode}
				.username=${this._username}
				.password=${this._password}
				@form-change=${this._handleFormChange}
				@form-submit=${this._handleFormSubmit}
			></auth-form>

			<users-list
				.users=${this._availableUsers}
				@user-select=${this._handleUserSelect}
			></users-list>
		`);
	}

	_renderCard(content) {
		return html`<div class="card">${content}</div>`;
	}

	// === Event Handlers ===

	_handleModeChange(e) {
		this._mode = e.detail.mode;
	}

	_handleFormChange(e) {
		this._username = e.detail.username;
		this._password = e.detail.password;
	}

	_handleFormSubmit(e) {
		const { mode, username, password } = e.detail;
		const eventType = mode === 'login' ? 'LOGIN' : 'REGISTER';

		this.actor?.send({
			type: eventType,
			username,
			password,
		});

		// Очищаем пароль после отправки
		this._password = '';
	}

	_handleUserSelect(e) {
		this._username = e.detail.username;
		this._mode = 'login';

		// Фокус на поле пароля
		this.updateComplete.then(() => {
			const form = this.shadowRoot.querySelector('auth-form');
			form?.focusPassword();
		});
	}
}

customElements.define('auth-screen', AuthScreen);
