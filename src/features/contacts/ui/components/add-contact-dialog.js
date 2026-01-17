// src/features/contacts/ui/components/add-contact-dialog.js

import { LitElement, html, css } from 'lit';

export class AddContactDialog extends LitElement {
	static properties = {
		open: { type: Boolean, reflect: true },
		groups: { type: Array },
		loading: { type: Boolean },
		error: { type: String },
		currentUserId: { type: String },
	};

	static styles = css`
		:host {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			align-items: center;
			justify-content: center;
		}

		:host([open]) {
			display: flex;
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
		}

		.dialog {
			position: fixed;
			left: 50%;
			top: 2rem;
			transform: translateX(-50%);
			background: var(--color-surface);
			border-radius: var(--radius-l);
			box-shadow: var(--shadow-lg);
			width: 90%;
			max-width: 500px;
			max-height: 90vh;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		.dialog-header {
			padding: var(--space-l);
			border-bottom: 1px solid var(--border-color);
		}

		.dialog-title {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0;
		}

		.dialog-body {
			padding: var(--space-l);
			overflow-y: auto;
		}

		.form-group {
			margin-bottom: var(--space-m);
		}

		.form-label {
			display: block;
			font-weight: 500;
			font-size: 0.875rem;
			margin-bottom: var(--space-xs);
			color: var(--color-text-main);
		}

		.form-input,
		.form-textarea {
			width: calc(99% - var(--space-l));
			padding: var(--space-s);
			border: 1px solid var(--border-color);
			border-radius: var(--radius-m);
			font-size: 0.9375rem;
			font-family: inherit;
			background: var(--color-bg);
			color: var(--color-text-main);
			transition: border-color var(--transition-fast);
		}

		.form-input:focus,
		.form-textarea:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px var(--color-primary-soft);
		}

		.form-textarea {
			resize: vertical;
			min-height: 120px;
			font-family: var(--font-mono);
			font-size: 0.8125rem;
		}

		.form-hint {
			font-size: 0.8125rem;
			color: var(--color-text-muted);
			margin-top: var(--space-xs);
		}

		.error-message {
			background: var(--color-danger-soft);
			color: var(--color-danger);
			padding: var(--space-s);
			border-radius: var(--radius-m);
			font-size: 0.875rem;
			margin-bottom: var(--space-m);
		}

		.dialog-footer {
			padding: var(--space-m) var(--space-l);
			border-top: 1px solid var(--border-color);
			display: flex;
			gap: var(--space-s);
			justify-content: flex-end;
		}

		.btn {
			padding: var(--space-xs) var(--space-m);
			border: none;
			border-radius: var(--radius-m);
			font-weight: 500;
			font-size: 0.9375rem;
			cursor: pointer;
			transition: all var(--transition-fast);
		}

		.btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.btn-secondary {
			background: var(--color-surface-raised);
			color: var(--color-text-main);
		}

		.btn-secondary:hover:not(:disabled) {
			background: var(--color-bg-hover);
		}

		.btn-primary {
			background: var(--color-primary);
			color: var(--color-white);
		}

		.btn-primary:hover:not(:disabled) {
			background: var(--color-primary-dark);
		}

		.spinner {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid rgba(255, 255, 255, 0.3);
			border-radius: 50%;
			border-top-color: white;
			animation: spin 0.6s linear infinite;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	`;

	constructor() {
		super();
		this.open = false;
		this.groups = [];
		this.loading = false;
		this.error = null;
	}

	_parsePublicKey(input) {
		if (!input || typeof input !== 'string') {
			throw new Error('Invalid input');
		}

		// 1) Try raw JSON
		try {
			return JSON.parse(input);
		} catch (e) {}

		// 2) Try base64 / url-safe base64 -> UTF-8 -> JSON
		const normalizeBase64 = (s) => s.replace(/-/g, '+').replace(/_/g, '/');

		try {
			let b = input.trim();
			b = normalizeBase64(b);
			while (b.length % 4 !== 0) b += '=';

			const binary = atob(b);
			const bytes = new Uint8Array(
				Array.from(binary).map((c) => c.charCodeAt(0))
			);
			const jsonText = new TextDecoder().decode(bytes);
			return JSON.parse(jsonText);
		} catch (err) {
			// fall through
		}

		throw new Error('Invalid public key');
	}

	_handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			this._close();
		}
	}

	_close() {
		this.open = false;
		this.error = null;
		// Очищаем форму
		const form = this.shadowRoot?.querySelector('form');
		if (form) form.reset();
		this.dispatchEvent(new CustomEvent('dialog-close'));
	}

	_handleSubmit(e) {
		e.preventDefault();

		const formData = new FormData(e.target);
		const publicKey = formData.get('publicKey').trim();
		const group = formData.get('group')?.trim() || 'Default';

		// Валидация
		if (!publicKey) {
			this.error = 'Введите публичный ключ пользователя';
			return;
		}

		// Парсим публичный ключ
		let parsedKey;
		try {
			parsedKey = this._parsePublicKey(publicKey);
		} catch (err) {
			this.error = 'Неверный формат публичного ключа';
			return;
		}

		console.log('🔍 Parsed key:', JSON.stringify(parsedKey, null, 2));

		const userId = parsedKey?.uid || parsedKey?.u;
		if (!userId) {
			this.error = 'Публичный ключ не содержит userId';
			console.error('❌ No uid in parsed key:', parsedKey);
			return;
		}

		// Проверяем что не добавляем самого себя
		if (this.currentUserId && userId === this.currentUserId) {
			this.error = 'Вы не можете добавить самого себя';
			console.warn('⚠️ User trying to add themselves');
			return;
		}

		console.log('✅ Extracted userId:', userId.slice(0, 16) + '...');

		// Отправляем событие БЕЗ username — имя придёт от контакта
		this.dispatchEvent(
			new CustomEvent('add-contact', {
				detail: {
					userId: userId,
					exchangePublicKey: parsedKey,
					group: group,
					// username НЕ передаём — будет взято из профиля отправителя
				},
				bubbles: true,
				composed: true,
			})
		);

		this._close();
	}

	render() {
		return html`
			<div class="overlay" @click=${this._handleOverlayClick}>
				<div class="dialog" @click=${(e) => e.stopPropagation()}>
					<div class="dialog-header">
						<h2 class="dialog-title">Добавить контакт</h2>
					</div>

					<form class="dialog-body" @submit=${this._handleSubmit}>
						${this.error
							? html`<div class="error-message">${this.error}</div>`
							: ''}

						<div class="form-group">
							<label class="form-label" for="publicKey">
								Ключ приглашения
							</label>
							<textarea
								id="publicKey"
								name="publicKey"
								class="form-textarea"
								placeholder="Вставьте ключ приглашения, полученный от пользователя"
								required
								?disabled=${this.loading}
							></textarea>
							<div class="form-hint">
								Попросите пользователя скопировать свой ключ из Настроек → Ключ
								приглашения
							</div>
						</div>

						<div class="form-group">
							<label class="form-label" for="group">
								Группа (необязательно)
							</label>
							<input
								list="groups"
								id="group"
								name="group"
								class="form-input"
								placeholder="Выберите или создайте группу"
								value="Default"
								?disabled=${this.loading}
							/>
							<datalist id="groups">
								${this.groups.map((g) => html`<option value=${g}></option>`)}
							</datalist>
						</div>

						<div class="dialog-footer">
							<button
								type="button"
								class="btn btn-secondary"
								@click=${this._close}
								?disabled=${this.loading}
							>
								Отмена
							</button>
							<button
								type="submit"
								class="btn btn-primary"
								?disabled=${this.loading}
							>
								${this.loading
									? html`<span class="spinner"></span>`
									: 'Отправить запрос'}
							</button>
						</div>
					</form>
				</div>
			</div>
		`;
	}
}

customElements.define('add-contact-dialog', AddContactDialog);
