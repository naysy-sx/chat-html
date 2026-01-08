// src/features/settings/settings.ui.js

import { LitElement, html, css } from 'lit';

export class SettingsView extends LitElement {
	static properties = {
		settingsActor: { type: Object },

		_profile: { type: Object, state: true },
		_servers: { type: Array, state: true },
		_activeServerId: { type: String, state: true },
		_invitationKey: { type: String, state: true },
		_identity: { type: Object, state: true },
		_error: { type: String, state: true },
		_state: { type: String, state: true },

		// Локальное состояние для полей пароля (чтобы работала валидация при вводе)
		_oldPassword: { type: String, state: true },
		_newPassword: { type: String, state: true },
		_confirmPassword: { type: String, state: true },
	};

	static styles = css`
		:host {
			display: block;
			max-width: 800px;
			margin: 0 auto;
		}

		.settings-container {
			display: flex;
			flex-direction: column;
			gap: var(--space-l);
		}

		.section {
			background: var(--color-surface);
			border-radius: var(--radius-l);
			padding: var(--space-l);
			box-shadow: var(--shadow-card);
		}

		.section-title {
			margin: 0 0 var(--space-m) 0;
			font-size: var(--text-xl);
			font-weight: 600;
			color: var(--color-text-main);
		}

		.form-group {
			margin-bottom: var(--space-m);
		}

		.form-group:last-child {
			margin-bottom: 0;
		}

		.label {
			display: block;
			margin-bottom: var(--space-xs);
			font-weight: 500;
			color: var(--color-text-main);
			font-size: var(--text-sm);
		}

		.input,
		.textarea,
		.select {
			width: 100%;
			padding: var(--space-s) var(--space-m);
			border: 1px solid var(--border-color);
			border-radius: var(--radius-m);
			font-size: var(--text-body);
			font-family: inherit;
			background: var(--color-bg);
			color: var(--color-text-main);
			transition: all var(--transition-fast);
			box-sizing: border-box;
		}

		/* === Стили валидации === */
		.input.valid {
			border-color: #10b981; /* Зеленый */
			box-shadow: 0 0 0 1px #10b981;
		}

		.input.invalid {
			border-color: #ef4444; /* Красный */
			box-shadow: 0 0 0 1px #ef4444;
		}

		.input:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px var(--color-primary-soft);
		}

		.textarea {
			resize: vertical;
			min-height: 80px;
		}

		.avatar-section {
			display: flex;
			align-items: center;
			gap: var(--space-m);
		}

		.avatar {
			width: 80px;
			height: 80px;
			border-radius: var(--radius-full);
			background: var(--color-surface-raised);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 2rem;
			color: var(--color-text-muted);
			object-fit: cover;
			overflow: hidden;
		}

		.avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.file-input {
			display: none;
		}

		/* ===== Buttons ===== */
		.button {
			padding: var(--space-s) var(--space-m);
			border: none;
			border-radius: var(--radius-m);
			font-size: var(--text-sm);
			font-weight: 500;
			cursor: pointer;
			transition: background var(--transition-fast),
				transform var(--transition-fast), box-shadow var(--transition-fast);
			box-shadow: var(--shadow-sm);
		}

		.button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.button-primary {
			background: var(--color-primary);
			color: white;
		}

		.button-primary:hover:not(:disabled) {
			background: var(--color-primary-dark);
			transform: translateY(-1px);
			box-shadow: var(--shadow-md);
		}

		.button-secondary {
			background: var(--color-surface-raised);
			color: var(--color-text-main);
			box-shadow: none;
			border: 1px solid var(--border-color);
		}

		.button-secondary:hover {
			background: var(--color-bg-hover);
		}

		.button-danger {
			background: var(--color-danger-soft);
			color: var(--color-danger-text);
			box-shadow: none;
		}

		.button-danger:hover {
			background: var(--color-danger-border);
		}

		/* ===== Invitation Key ===== */
		.invitation-key {
			display: flex;
			gap: var(--space-s);
			align-items: center;
		}

		.key-code {
			flex: 1;
			padding: var(--space-s) var(--space-m);
			background: var(--color-surface-raised);
			border: 1px solid var(--border-color);
			border-radius: var(--radius-m);
			font-family: var(--font-mono);
			font-size: var(--text-sm);
			word-break: break-all;
			cursor: pointer;
			user-select: all;
			transition: background var(--transition-fast);
		}

		.key-code:hover {
			background: var(--color-bg-hover);
		}

		/* ===== Server List ===== */
		.server-list {
			display: flex;
			flex-direction: column;
			gap: var(--space-s);
			margin-top: var(--space-m);
		}

		.server-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: var(--space-s) var(--space-m);
			background: var(--color-surface-raised);
			border-radius: var(--radius-m);
			border: 2px solid transparent;
			transition: border-color var(--transition-fast),
				background var(--transition-fast);
		}

		.server-item.active {
			border-color: var(--color-primary);
			background: var(--color-primary-soft);
		}

		.server-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--space-3xs);
		}

		.server-label {
			font-weight: 500;
			color: var(--color-text-main);
		}

		.server-url {
			font-size: var(--text-xs);
			color: var(--color-text-muted);
			font-family: var(--font-mono);
		}

		.server-actions {
			display: flex;
			gap: var(--space-xs);
		}

		.icon-button {
			padding: var(--space-xs);
			border: none;
			background: transparent;
			cursor: pointer;
			border-radius: var(--radius-s);
			color: var(--color-text-muted);
			transition: background var(--transition-fast),
				color var(--transition-fast);
		}

		.icon-button:hover {
			background: var(--color-bg-hover);
			color: var(--color-text-main);
		}

		/* ===== Messages ===== */
		.error-message {
			padding: var(--space-s) var(--space-m);
			background: var(--color-danger-soft);
			border: 1px solid var(--color-danger-border);
			border-radius: var(--radius-m);
			color: var(--color-danger-text);
			margin-bottom: var(--space-m);
		}

		.loading {
			text-align: center;
			padding: var(--space-xl);
			color: var(--color-text-muted);
		}

		.help-text {
			font-size: var(--text-xs);
			color: var(--color-text-muted);
			margin-top: var(--space-xs);
		}

		/* ===== Checkbox Styles ===== */
		.checkbox-group {
			display: flex;
			align-items: flex-start;
			gap: var(--space-s);
			padding: var(--space-m);
			background: var(--color-surface-raised);
			border-radius: var(--radius-m);
			cursor: pointer;
			transition: background var(--transition-fast);
		}

		.checkbox-group:hover {
			background: var(--color-bg-hover);
		}

		.checkbox-input {
			width: 20px;
			height: 20px;
			margin: 0;
			cursor: pointer;
			accent-color: var(--color-primary);
		}

		.checkbox-content {
			flex: 1;
		}

		.checkbox-label {
			font-weight: 500;
			color: var(--color-text-main);
			margin-bottom: var(--space-3xs);
		}

		.checkbox-description {
			font-size: var(--text-xs);
			color: var(--color-text-muted);
			line-height: var(--line-normal);
		}

		/* ===== Discovery Section ===== */
		.discovery-section {
			border: 2px dashed var(--color-primary);
			background: var(--color-primary-soft);
		}

		.discovery-section .section-title {
			color: var(--color-primary);
		}

		.discovery-badge {
			display: inline-block;
			padding: var(--space-3xs) var(--space-xs);
			background: var(--color-primary);
			color: white;
			border-radius: var(--radius-xs);
			font-size: var(--text-xs);
			font-weight: 600;
			margin-left: var(--space-xs);
			vertical-align: middle;
		}
	`;

	constructor() {
		super();
		this._profile = null;
		this._servers = [];
		this._activeServerId = null;
		this._invitationKey = '';
		this._identity = null;
		this._error = null;
		this._state = 'loading';

		// Инициализация полей пароля
		this._oldPassword = '';
		this._newPassword = '';
		this._confirmPassword = '';

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
		if (changedProperties.has('settingsActor') && this.settingsActor) {
			this._subscribe();
		}
	}

	_subscribe() {
		if (!this.settingsActor) return;

		this._subscription?.unsubscribe();

		const snapshot = this.settingsActor.getSnapshot();
		this._updateFromSnapshot(snapshot);

		this._subscription = this.settingsActor.subscribe((snapshot) => {
			this._updateFromSnapshot(snapshot);
		});
	}

	_updateFromSnapshot(snapshot) {
		this._state = snapshot.value;
		this._profile = snapshot.context.profile;
		this._servers = snapshot.context.signalingServers;
		this._activeServerId = snapshot.context.activeServerId;
		this._error = snapshot.context.error;
		this._identity = snapshot.context.identity;

		// Генерируем invitation key при обновлении
		this._generateInvitationKey();
	}

	_generateInvitationKey() {
		if (!this._identity || !this.settingsActor) return;

		const settingsSnapshot = this.settingsActor.getSnapshot();

		if (settingsSnapshot.context.service) {
			try {
				this._invitationKey =
					settingsSnapshot.context.service.generateInvitationKey(
						this._identity
					);
			} catch (err) {
				console.error('Failed to generate invitation key:', err);
				this._invitationKey = 'Ошибка генерации ключа';
			}
		}
	}

	render() {
		if (this._state === 'loading') {
			return html`<div class="loading">Загрузка настроек...</div>`;
		}

		return html`
			<div class="settings-container">
				${this._error ? this._renderError() : ''}
				${this._renderProfileSection()} ${this._renderSecuritySection()}
				${this._renderDiscoverySection()} ${this._renderInvitationSection()}
				${this._renderServersSection()}
			</div>
		`;
	}

	_renderError() {
		// Оставляем общий вывод ошибок для других ситуаций,
		// но для пароля мы используем alert
		return html` <div class="error-message">⚠️ ${this._error}</div> `;
	}

	_renderProfileSection() {
		return html`
			<div class="section">
				<h2 class="section-title">Профиль</h2>

				<div class="form-group avatar-section">
					<div class="avatar">
						${this._profile?.avatar
							? html`<img src=${this._profile.avatar} alt="Аватар" />`
							: html`${(this._profile?.displayName ||
									this._profile?.username)?.[0]?.toUpperCase() || '?'}`}
					</div>
					<div>
						<input
							type="file"
							class="file-input"
							id="avatar-input"
							accept="image/*"
							@change=${this._handleAvatarUpload}
						/>
						<button
							class="button button-secondary"
							@click=${() =>
								this.shadowRoot.getElementById('avatar-input').click()}
						>
							Заменить аватар
						</button>
						<p class="help-text">
							Изображение будет обрезано до 200×200 пикселей
						</p>
					</div>
				</div>

				<div class="form-group">
					<label class="label">Имя для отображения</label>
					<input
						type="text"
						class="input"
						.value=${this._profile?.displayName ||
						this._profile?.username ||
						''}
						@input=${this._handleDisplayNameChange}
						placeholder="Введите имя"
					/>
					<p class="help-text">
						3-32 символа: буквы, цифры, дефис, подчёркивание
					</p>
				</div>

				<div class="form-group">
					<label class="label">Кратко обо мне</label>
					<textarea
						class="textarea"
						.value=${this._profile?.bio || ''}
						@input=${this._handleBioChange}
						placeholder="Расскажите о себе (необязательно)"
					></textarea>
					<p class="help-text">До 500 символов</p>
				</div>

				<button
					class="button button-primary"
					@click=${this._handleSaveProfile}
					?disabled=${this._state === 'savingProfile'}
				>
					${this._state === 'savingProfile' ? 'Сохранение...' : 'Сохранить'}
				</button>
			</div>
		`;
	}

	_renderSecuritySection() {
		// Логика валидации для подсветки
		const isNewPasswordEntered = this._newPassword.length > 0;
		const isNewPasswordValid = this._newPassword.length >= 4;

		const isConfirmEntered = this._confirmPassword.length > 0;
		const isConfirmMatch = this._newPassword === this._confirmPassword;

		// Классы для инпутов
		const newPassClass = isNewPasswordEntered
			? isNewPasswordValid
				? 'input valid'
				: 'input invalid'
			: 'input';

		const confirmPassClass = isConfirmEntered
			? isConfirmMatch && isNewPasswordValid
				? 'input valid'
				: 'input invalid'
			: 'input';

		return html`
			<div class="section">
				<h2 class="section-title">🔒 Безопасность</h2>

				<div class="form-group">
					<label class="label">Логин (не изменяется)</label>
					<input
						type="text"
						class="input"
						.value=${this._profile?.username || ''}
						disabled
						style="opacity: 0.6; cursor: not-allowed; background: var(--color-surface-raised);"
					/>
					<p class="help-text">
						Это ваш логин для входа в систему. Изменить нельзя.
					</p>
				</div>

				<div
					style="margin-top: var(--space-l); padding-top: var(--space-l); border-top: 1px solid var(--border-color);"
				>
					<h3
						style="margin: 0 0 var(--space-m) 0; font-size: var(--text-lg); font-weight: 600;"
					>
						Изменить пароль
					</h3>

					<div class="form-group">
						<label class="label">Текущий пароль</label>
						<input
							type="password"
							class="input"
							id="old-password"
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
							class="${newPassClass}"
							id="new-password"
							.value=${this._newPassword}
							@input=${(e) => (this._newPassword = e.target.value)}
							placeholder="Введите новый пароль"
							autocomplete="new-password"
						/>
						<p class="help-text">Минимум 4 символа</p>
					</div>

					<div class="form-group">
						<label class="label">Повторите новый пароль</label>
						<input
							type="password"
							class="${confirmPassClass}"
							id="new-password-confirm"
							.value=${this._confirmPassword}
							@input=${(e) => (this._confirmPassword = e.target.value)}
							placeholder="Повторите новый пароль"
							autocomplete="new-password"
						/>
					</div>

					<button
						class="button button-primary"
						@click=${this._handleChangePassword}
						?disabled=${this._state === 'changingPassword'}
					>
						${this._state === 'changingPassword'
							? 'Изменение...'
							: 'Изменить пароль'}
					</button>
				</div>
			</div>
		`;
	}

	_renderDiscoverySection() {
		const isEnabled = this._profile?.showInDiscovery || false;

		return html`
			<div class="section ${isEnabled ? 'discovery-section' : ''}">
				<h2 class="section-title">
					🌐 Обзор
					${isEnabled ? html`<span class="discovery-badge">Активно</span>` : ''}
				</h2>

				<div class="checkbox-group" @click=${this._handleDiscoveryToggle}>
					<input
						type="checkbox"
						class="checkbox-input"
						.checked=${isEnabled}
						@click=${(e) => e.stopPropagation()}
						@change=${this._handleDiscoveryToggle}
					/>
					<div class="checkbox-content">
						<div class="checkbox-label">
							Показывать мой профиль на странице «Обзор»
						</div>
						<div class="checkbox-description">
							Ваш аватар, имя и био будут видны всем пользователям чата в
							разделе «Обзор». Другие пользователи смогут отправить вам запрос
							на добавление в контакты.
						</div>
					</div>
				</div>

				${isEnabled
					? html`
							<p
								class="help-text"
								style="margin-top: var(--space-m); color: var(--color-primary);"
							>
								✨ Ваш профиль виден в разделе «Обзор» для всех пользователей
							</p>
					  `
					: html`
							<p class="help-text" style="margin-top: var(--space-m);">
								Включите эту опцию, чтобы другие пользователи могли найти вас
							</p>
					  `}
			</div>
		`;
	}

	_renderInvitationSection() {
		return html`
			<div class="section">
				<h2 class="section-title">Ключ приглашения</h2>

				<div class="form-group">
					<label class="label"
						>Нажмите чтобы скопировать ключ в буфер обмена</label
					>
					<div class="invitation-key">
						<code class="key-code" @click=${this._handleCopyKey}>
							${this._invitationKey || 'Загрузка...'}
						</code>
					</div>
					<p class="help-text">
						Отправьте этот ключ другим пользователям чтобы они могли добавить
						вас в контакты
					</p>
				</div>
			</div>
		`;
	}

	_renderServersSection() {
		const activeServer = this._servers.find(
			(s) => s.id === this._activeServerId
		);

		return html`
			<div class="section">
				<h2 class="section-title">Сигнальные серверы</h2>

				${activeServer
					? html`
							<div class="form-group">
								<label class="label">Текущий сервер</label>
								<div
									style="display: flex; gap: var(--space-s); align-items: center;"
								>
									<code
										style="flex: 1; padding: var(--space-s); background: var(--color-bg); border-radius: var(--radius-m);"
									>
										${activeServer.url}
									</code>
									${!activeServer.isDefault
										? html`
												<button
													class="button button-danger"
													@click=${() =>
														this._handleRemoveServer(activeServer.id)}
												>
													Удалить
												</button>
										  `
										: ''}
								</div>
							</div>
					  `
					: ''}

				<div class="form-group">
					<label class="label">Выбрать сервер</label>
					<select
						class="select"
						.value=${this._activeServerId || ''}
						@change=${this._handleServerSelect}
					>
						${this._servers.map(
							(server) => html`
								<option value=${server.id}>
									${server.label} ${server.isDefault ? '(по умолчанию)' : ''}
								</option>
							`
						)}
					</select>
				</div>

				<button class="button button-secondary" @click=${this._handleAddServer}>
					➕ Добавить сигнальный сервер
				</button>

				<p class="help-text" style="margin-top: var(--space-m);">
					Вы можете добавить собственные сигнальные серверы для установки
					соединений
				</p>
			</div>
		`;
	}

	// === Event Handlers ===

	_handleAvatarUpload(e) {
		const file = e.target.files?.[0];
		if (file) {
			this.settingsActor.send({ type: 'UPLOAD_AVATAR', file });
		}
	}

	_handleDisplayNameChange(e) {
		this.settingsActor.send({
			type: 'UPDATE_PROFILE',
			updates: { displayName: e.target.value },
		});
	}

	_handleBioChange(e) {
		this.settingsActor.send({
			type: 'UPDATE_PROFILE',
			updates: { bio: e.target.value },
		});
	}

	_handleDiscoveryToggle(e) {
		if (e.target.type === 'checkbox') {
			e.stopPropagation();
		}

		const newValue = !this._profile?.showInDiscovery;

		this.settingsActor.send({
			type: 'UPDATE_PROFILE',
			updates: { showInDiscovery: newValue },
		});

		setTimeout(() => {
			this.settingsActor.send({ type: 'SAVE_PROFILE' });
		}, 50);
	}

	_handleSaveProfile() {
		this.settingsActor.send({ type: 'SAVE_PROFILE' });
	}

	_handleCopyKey() {
		if (this._invitationKey) {
			navigator.clipboard.writeText(this._invitationKey).then(() => {
				alert(
					'Ваш ключ скопирован и находится в буфере обмена. Теперь вы можете отправить его другим пользователям'
				);
			});
		}
	}

	_handleServerSelect(e) {
		this.settingsActor.send({
			type: 'SET_ACTIVE_SERVER',
			serverId: e.target.value,
		});
	}

	_handleAddServer() {
		const url = prompt('Введите URL сигнального сервера (wss://...):');
		if (url) {
			try {
				this.settingsActor.send({ type: 'ADD_SERVER', url });
			} catch (err) {
				alert(err.message);
			}
		}
	}

	_handleRemoveServer(serverId) {
		if (confirm('Удалить этот сервер?')) {
			this.settingsActor.send({ type: 'REMOVE_SERVER', serverId });
		}
	}

	_handleChangePassword() {
		// Валидация перед отправкой
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

		// Отправляем событие в actor
		this.settingsActor.send({
			type: 'CHANGE_PASSWORD',
			oldPassword: this._oldPassword,
			newPassword: this._newPassword,
		});

		// Подписываемся на результат
		const sub = this.settingsActor.subscribe((snapshot) => {
			// Проверяем, вернулись ли мы в ready
			if (snapshot.matches('ready')) {
				// 1. ОШИБКА (например, неверный старый пароль)
				if (snapshot.context.error) {
					// Показываем Alert!
					alert('❌ Ошибка: ' + snapshot.context.error);
					sub.unsubscribe();
				}
				// 2. УСПЕХ (флаг passwordSuccess установлен)
				else if (snapshot.context.passwordSuccess) {
					// Показываем Alert с напоминанием
					alert(
						`✅ Пароль успешно изменён!\n\nЗапомните новый пароль: ${this._newPassword}`
					);

					// Очищаем поля ТОЛЬКО при успехе
					this._oldPassword = '';
					this._newPassword = '';
					this._confirmPassword = '';

					sub.unsubscribe();
				}
				// Если ни ошибки, ни успеха нет - ждем дальше
			}
		});
	}
}

customElements.define('settings-view', SettingsView);
