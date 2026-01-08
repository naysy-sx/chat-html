// src/features/settings/ui/sections/security-section.js
import { LitElement, html, css } from 'lit';
import {
	sectionStyles,
	formStyles,
	buttonStyles,
} from '../../../../shared/ui/index.js';

export class SecuritySection extends LitElement {
	static properties = {
		actor: { type: Object },
		username: { type: String },
		state: { type: String },
	};

	static styles = [
		sectionStyles,
		formStyles,
		buttonStyles,
		css`
			.password-divider {
				margin-top: var(--space-l);
				padding-top: var(--space-l);
				border-top: 1px solid var(--color-border);
			}

			.subsection-title {
				margin: 0 0 var(--space-m) 0;
				font-size: var(--text-lg);
				font-weight: 600;
			}
		`,
	];

	constructor() {
		super();
		this._oldPassword = '';
		this._newPassword = '';
		this._confirmPassword = '';
	}

	render() {
		return html`
			<div class="section">
				<h2 class="section-title">🔒 Безопасность</h2>

				<!-- Логин (readonly) -->
				<div class="form-group">
					<label class="label">Логин (не изменяется)</label>
					<input
						type="text"
						class="input"
						.value=${this.username || ''}
						disabled
					/>
					<p class="help-text">
						Это ваш логин для входа в систему. Изменить нельзя.
					</p>
				</div>

				<!-- Смена пароля -->
				<div class="password-divider">
					<h3 class="subsection-title">Изменить пароль</h3>

					<div class="form-group">
						<label class="label">Текущий пароль</label>
						<input
							type="password"
							class="input"
							.value=${this._oldPassword}
							@input=${(e) => (this._oldPassword = e.target.value)}
							placeholder="Введите текущий пароль"
							autocomplete="current-password"
						/>
					</div>

					<div class="form-group">
						<label class="label">Новый пароль</label>
						<input
							type="password"
							class=${this._getNewPasswordClass()}
							.value=${this._newPassword}
							@input=${(e) => {
								this._newPassword = e.target.value;
								this.requestUpdate();
							}}
							placeholder="Введите новый пароль"
							autocomplete="new-password"
						/>
						<p class="help-text">Минимум 4 символа</p>
					</div>

					<div class="form-group">
						<label class="label">Повторите новый пароль</label>
						<input
							type="password"
							class=${this._getConfirmPasswordClass()}
							.value=${this._confirmPassword}
							@input=${(e) => {
								this._confirmPassword = e.target.value;
								this.requestUpdate();
							}}
							placeholder="Повторите новый пароль"
							autocomplete="new-password"
						/>
					</div>

					<button
						class="btn btn--primary"
						@click=${this._handleChangePassword}
						?disabled=${this.state === 'changingPassword'}
					>
						${this.state === 'changingPassword'
							? 'Изменение...'
							: 'Изменить пароль'}
					</button>
				</div>
			</div>
		`;
	}

	_getNewPasswordClass() {
		if (!this._newPassword) return 'input';
		return this._newPassword.length >= 4
			? 'input input--valid'
			: 'input input--invalid';
	}

	_getConfirmPasswordClass() {
		if (!this._confirmPassword) return 'input';
		const isValid =
			this._newPassword === this._confirmPassword &&
			this._newPassword.length >= 4;
		return isValid ? 'input input--valid' : 'input input--invalid';
	}

	_handleChangePassword() {
		// Валидация
		if (!this._oldPassword || !this._newPassword || !this._confirmPassword) {
			alert('Заполните все поля');
			return;
		}

		if (this._newPassword !== this._confirmPassword) {
			alert('Новые пароли не совпадают');
			return;
		}

		if (this._newPassword.length < 4) {
			alert('Пароль должен содержать минимум 4 символа');
			return;
		}

		if (this._oldPassword === this._newPassword) {
			alert('Новый пароль должен отличаться от текущего');
			return;
		}

		// Отправляем в актор
		this.actor?.send({
			type: 'CHANGE_PASSWORD',
			oldPassword: this._oldPassword,
			newPassword: this._newPassword,
		});

		// Подписываемся на результат
		this._waitForResult();
	}

	_waitForResult() {
		const savedNewPassword = this._newPassword;

		const unsubscribe = this.actor?.subscribe((snapshot) => {
			if (snapshot.matches('ready')) {
				if (snapshot.context.error) {
					alert('❌ Ошибка: ' + snapshot.context.error);
					unsubscribe?.unsubscribe();
				} else if (snapshot.context.passwordSuccess) {
					alert(
						`✅ Пароль успешно изменён!\n\nЗапомните новый пароль: ${savedNewPassword}`
					);
					this._clearForm();
					unsubscribe?.unsubscribe();
				}
			}
		});
	}

	_clearForm() {
		this._oldPassword = '';
		this._newPassword = '';
		this._confirmPassword = '';
		this.requestUpdate();
	}
}

customElements.define('security-section', SecuritySection);
