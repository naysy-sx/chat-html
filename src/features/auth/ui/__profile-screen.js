// src/features/auth/ui/profile-screen.js
import { LitElement, html } from 'lit';
import { profileScreenStyles } from './profile-screen.css.js';
import { buttonStyles } from '../../../shared/ui/index.js';

export class ProfileScreen extends LitElement {
	static properties = {
		actor: { type: Object },
		username: { type: String },
		_showDeleteConfirm: { state: true },
	};

	static styles = [buttonStyles, profileScreenStyles];

	constructor() {
		super();
		this._showDeleteConfirm = false;
	}

	render() {
		const avatarLetter = this.username?.[0]?.toUpperCase() || '?';

		return html`
			<div class="profile-header">
				<div class="avatar">${avatarLetter}</div>
				<div class="user-info">
					<h2>${this.username}</h2>
					<p>Вы вошли в систему</p>
				</div>
			</div>

			<div class="actions">
				<button class="btn btn--secondary" @click=${this._handleLogout}>
					🚪 Выйти
				</button>
				<button class="btn btn--danger" @click=${this._showConfirm}>
					🗑️ Удалить аккаунт
				</button>
			</div>

			${this._showDeleteConfirm ? this._renderConfirmDialog() : ''}
		`;
	}

	_renderConfirmDialog() {
		return html`
			<div class="confirm-dialog" @click=${this._closeDialog}>
				<div class="confirm-content" @click=${(e) => e.stopPropagation()}>
					<h3>⚠️ Удалить аккаунт?</h3>
					<p>
						Это действие нельзя отменить. Все ваши данные, включая сообщения и
						настройки, будут удалены.
					</p>
					<div class="confirm-buttons">
						<button class="btn btn--secondary" @click=${this._closeDialog}>
							Отмена
						</button>
						<button class="btn btn--danger" @click=${this._handleDelete}>
							Удалить
						</button>
					</div>
				</div>
			</div>
		`;
	}

	_handleLogout() {
		this.actor?.send({ type: 'LOGOUT' });
	}

	_showConfirm() {
		this._showDeleteConfirm = true;
	}

	_closeDialog() {
		this._showDeleteConfirm = false;
	}

	_handleDelete() {
		this.actor?.send({ type: 'DELETE_ACCOUNT' });
		this._showDeleteConfirm = false;
	}
}

customElements.define('profile-screen', ProfileScreen);
