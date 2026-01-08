// src/features/settings/ui/sections/profile-section.js
import { LitElement, html, css } from 'lit';
import {
	sectionStyles,
	formStyles,
	buttonStyles,
	avatarStyles,
} from '../../../../shared/ui/index.js';

export class ProfileSection extends LitElement {
	static properties = {
		actor: { type: Object },
		profile: { type: Object },
		state: { type: String },
	};

	static styles = [
		sectionStyles,
		formStyles,
		buttonStyles,
		avatarStyles,
		css`
			.avatar-row {
				display: flex;
				align-items: center;
				gap: var(--space-m);
			}

			.avatar-controls {
				display: flex;
				flex-direction: column;
				gap: var(--space-xs);
			}
		`,
	];

	render() {
		const displayName =
			this.profile?.displayName || this.profile?.username || '';
		const avatarLetter = displayName[0]?.toUpperCase() || '?';

		return html`
			<div class="section">
				<h2 class="section-title">Профиль</h2>

				<!-- Аватар -->
				<div class="form-group avatar-row">
					<div class="avatar avatar--xl">
						${this.profile?.avatar
							? html`<img src=${this.profile.avatar} alt="Аватар" />`
							: avatarLetter}
					</div>
					<div class="avatar-controls">
						<input
							type="file"
							class="file-input"
							id="avatar-input"
							accept="image/*"
							@change=${this._handleAvatarUpload}
						/>
						<button class="btn btn--secondary" @click=${this._triggerFileInput}>
							Заменить аватар
						</button>
						<p class="help-text">Изображение будет обрезано до 200×200</p>
					</div>
				</div>

				<!-- Имя -->
				<div class="form-group">
					<label class="label">Имя для отображения</label>
					<input
						type="text"
						class="input"
						.value=${displayName}
						@input=${this._handleDisplayNameChange}
						placeholder="Введите имя"
					/>
					<p class="help-text">
						3-32 символа: буквы, цифры, дефис, подчёркивание
					</p>
				</div>

				<!-- Био -->
				<div class="form-group">
					<label class="label">Кратко обо мне</label>
					<textarea
						class="textarea"
						.value=${this.profile?.bio || ''}
						@input=${this._handleBioChange}
						placeholder="Расскажите о себе (необязательно)"
					></textarea>
					<p class="help-text">До 500 символов</p>
				</div>

				<!-- Кнопка сохранения -->
				<button
					class="btn btn--primary"
					@click=${this._handleSave}
					?disabled=${this.state === 'savingProfile'}
				>
					${this.state === 'savingProfile' ? 'Сохранение...' : 'Сохранить'}
				</button>
			</div>
		`;
	}

	_triggerFileInput() {
		this.shadowRoot.getElementById('avatar-input').click();
	}

	_handleAvatarUpload(e) {
		const file = e.target.files?.[0];
		if (file) {
			this.actor?.send({ type: 'UPLOAD_AVATAR', file });
		}
	}

	_handleDisplayNameChange(e) {
		this.actor?.send({
			type: 'UPDATE_PROFILE',
			updates: { displayName: e.target.value },
		});
	}

	_handleBioChange(e) {
		this.actor?.send({
			type: 'UPDATE_PROFILE',
			updates: { bio: e.target.value },
		});
	}

	_handleSave() {
		this.actor?.send({ type: 'SAVE_PROFILE' });
	}
}

customElements.define('profile-section', ProfileSection);
