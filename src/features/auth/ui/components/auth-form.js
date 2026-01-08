// src/features/auth/ui/components/auth-form.js
import { LitElement, html, css } from 'lit';
import { formStyles, buttonStyles } from '../../../../shared/ui/index.js';

export class AuthForm extends LitElement {
	static properties = {
		mode: { type: String },
		username: { type: String },
		password: { type: String },
		disabled: { type: Boolean },
	};

	static styles = [
		formStyles,
		buttonStyles,
		css`
			:host {
				display: block;
			}

			.submit-btn {
				width: 100%;
				padding: var(--space-m);
				font-size: var(--text-body);
				font-weight: 600;
			}
		`,
	];

	constructor() {
		super();
		this.mode = 'login';
		this.username = '';
		this.password = '';
		this.disabled = false;
	}

	render() {
		const autocomplete =
			this.mode === 'register' ? 'new-password' : 'current-password';
		const submitText = this.mode === 'login' ? 'Войти' : 'Зарегистрироваться';

		return html`
			<form @submit=${this._handleSubmit}>
				<div class="form-group">
					<label class="label" for="username">Имя пользователя</label>
					<input
						id="username"
						type="text"
						class="input"
						.value=${this.username}
						@input=${this._onUsernameInput}
						placeholder="Введите имя"
						autocomplete="username"
						?disabled=${this.disabled}
						required
					/>
				</div>

				<div class="form-group">
					<label class="label" for="password">Пароль</label>
					<input
						id="password"
						type="password"
						class="input"
						.value=${this.password}
						@input=${this._onPasswordInput}
						placeholder="Введите пароль"
						autocomplete=${autocomplete}
						?disabled=${this.disabled}
						required
					/>
				</div>

				<button
					type="submit"
					class="btn btn--primary submit-btn"
					?disabled=${this.disabled}
				>
					${submitText}
				</button>
			</form>
		`;
	}

	_onUsernameInput(e) {
		this.username = e.target.value;
		this._dispatchChange();
	}

	_onPasswordInput(e) {
		this.password = e.target.value;
		this._dispatchChange();
	}

	_dispatchChange() {
		this.dispatchEvent(
			new CustomEvent('form-change', {
				detail: {
					username: this.username,
					password: this.password,
				},
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleSubmit(e) {
		e.preventDefault();

		if (!this.username.trim() || !this.password) {
			return;
		}

		this.dispatchEvent(
			new CustomEvent('form-submit', {
				detail: {
					mode: this.mode,
					username: this.username.trim(),
					password: this.password,
				},
				bubbles: true,
				composed: true,
			})
		);
	}

	// Публичный метод для фокуса на пароле
	focusPassword() {
		this.updateComplete.then(() => {
			this.shadowRoot.getElementById('password')?.focus();
		});
	}

	// Публичный метод для очистки пароля
	clearPassword() {
		this.password = '';
	}
}

customElements.define('auth-form', AuthForm);
