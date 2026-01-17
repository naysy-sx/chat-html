// src/features/contacts/ui/components/chat-placeholder.js

import { LitElement, html, css } from 'lit';

export class ChatPlaceholder extends LitElement {
	static properties = {
		contact: { type: Object },
		_showDeleteConfirm: { state: true },
	};

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: var(--color-bg, #fafafa);
		}

		/* Header */
		.chat-header {
			display: flex;
			align-items: center;
			gap: 16px;
			padding: 16px;
			background: var(--color-surface, #fff);
			border-bottom: 1px solid var(--border-color, #e5e5e5);
		}

		.avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: var(--color-primary, #7a5cff);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: 600;
			font-size: 1.25rem;
			flex-shrink: 0;
			overflow: hidden;
		}

		.avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.contact-info {
			flex: 1;
		}

		.contact-name {
			font-weight: 600;
			font-size: 1.125rem;
			color: var(--color-text-main, #1a1a1a);
		}

		.contact-status {
			font-size: 0.875rem;
			color: var(--color-text-muted, #666);
		}

		.contact-status.online {
			color: var(--color-success, #34d399);
		}

		.back-btn {
			display: none;
			padding: 8px;
			background: none;
			border: none;
			font-size: 1.25rem;
			cursor: pointer;
			border-radius: 50%;
			transition: background 0.2s;
		}

		.back-btn:hover {
			background: var(--color-bg-hover, #f0f0f0);
		}

		@media (max-width: 768px) {
			.back-btn {
				display: block;
			}
		}

		/* Messages area */
		.chat-messages {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 32px;
			text-align: center;
		}

		.placeholder-icon {
			font-size: 4rem;
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.placeholder-title {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--color-text-main, #1a1a1a);
			margin-bottom: 8px;
		}

		.placeholder-text {
			color: var(--color-text-muted, #666);
			font-size: 0.9375rem;
			max-width: 300px;
			line-height: 1.5;
		}

		.contact-bio {
			margin-top: 16px;
			padding: 12px 16px;
			background: var(--color-surface, #fff);
			border-radius: 12px;
			font-style: italic;
			color: var(--color-text-muted, #666);
			max-width: 280px;
		}

		/* Input area */
		.chat-input {
			padding: 16px;
			background: var(--color-surface, #fff);
			border-top: 1px solid var(--border-color, #e5e5e5);
		}

		.input-wrapper {
			display: flex;
			gap: 12px;
			align-items: center;
		}

		.input-field {
			flex: 1;
			padding: 12px 16px;
			background: var(--color-bg, #f5f5f5);
			border: 1px solid var(--border-color, #e5e5e5);
			border-radius: 24px;
			font-size: 0.9375rem;
			color: var(--color-text-main, #1a1a1a);
			outline: none;
			transition: border-color 0.2s;
		}

		.input-field:focus {
			border-color: var(--color-primary, #7a5cff);
		}

		.input-field::placeholder {
			color: var(--color-text-muted, #999);
		}

		.send-btn {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: var(--color-primary, #7a5cff);
			color: white;
			border: none;
			font-size: 1.25rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.2s, transform 0.1s;
		}

		.send-btn:hover {
			background: var(--color-primary-dark, #6b4ce6);
		}

		.send-btn:active {
			transform: scale(0.95);
		}

		.send-btn:disabled {
			background: var(--color-text-muted, #999);
			cursor: not-allowed;
		}

		/* Footer */
		.chat-footer {
			padding: 12px 16px;
			text-align: center;
			border-top: 1px solid var(--border-color, #e5e5e5);
			background: var(--color-surface, #fff);
		}

		.delete-link {
			color: var(--color-danger, #ef4444);
			text-decoration: none;
			font-size: 0.875rem;
			cursor: pointer;
			transition: opacity 0.2s;
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.delete-link:hover {
			opacity: 0.8;
			text-decoration: underline;
		}

		/* Delete confirmation */
		.delete-confirm {
			background: var(--color-danger-soft, #fee2e2);
			padding: 16px;
			margin: 16px;
			border-radius: 12px;
		}

		.delete-confirm-icon {
			font-size: 2rem;
			margin-bottom: 12px;
		}

		.delete-confirm-title {
			font-weight: 600;
			color: var(--color-danger, #ef4444);
			margin-bottom: 8px;
		}

		.delete-confirm-text {
			color: var(--color-text-main, #1a1a1a);
			font-size: 0.875rem;
			margin-bottom: 16px;
			line-height: 1.5;
		}

		.delete-confirm-actions {
			display: flex;
			gap: 12px;
			justify-content: center;
		}

		.btn {
			padding: 10px 20px;
			border: none;
			border-radius: 8px;
			font-weight: 500;
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.btn-danger {
			background: var(--color-danger, #ef4444);
			color: white;
		}

		.btn-danger:hover {
			background: #dc2626;
		}

		.btn-secondary {
			background: var(--color-surface, #fff);
			color: var(--color-text-main, #1a1a1a);
			border: 1px solid var(--border-color, #e5e5e5);
		}

		.btn-secondary:hover {
			background: var(--color-bg-hover, #f5f5f5);
		}

		/* Empty state */
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			text-align: center;
			padding: 32px;
		}

		.empty-state-icon {
			font-size: 5rem;
			margin-bottom: 24px;
			opacity: 0.4;
		}

		.empty-state-title {
			font-size: 1.5rem;
			font-weight: 600;
			color: var(--color-text-main, #1a1a1a);
			margin-bottom: 8px;
		}

		.empty-state-text {
			color: var(--color-text-muted, #666);
			font-size: 1rem;
			max-width: 300px;
		}
	`;

	constructor() {
		super();
		this.contact = null;
		this._showDeleteConfirm = false;
	}

	_getInitials(name) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	_formatLastSeen(timestamp) {
		if (!timestamp) return 'был(а) давно';

		const now = Date.now();
		const diff = now - timestamp;

		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'был(а) только что';
		if (minutes < 60) return `был(а) ${minutes} мин. назад`;
		if (hours < 24) return `был(а) ${hours} ч. назад`;
		if (days < 7) return `был(а) ${days} дн. назад`;

		const date = new Date(timestamp);
		return `был(а) ${date.toLocaleDateString('ru-RU')}`;
	}

	_handleBack() {
		this.dispatchEvent(
			new CustomEvent('close-chat', {
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleDeleteClick() {
		this._showDeleteConfirm = true;
	}

	_handleDeleteCancel() {
		this._showDeleteConfirm = false;
	}

	_handleDeleteConfirm() {
		this.dispatchEvent(
			new CustomEvent('delete-contact', {
				detail: {
					contactId: this.contact.id,
					block: true,
				},
				bubbles: true,
				composed: true,
			})
		);
		this._showDeleteConfirm = false;
	}

	_handleInputKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			this._handleSend();
		}
	}

	_handleSend() {
		const input = this.shadowRoot?.querySelector('.input-field');
		const text = input?.value?.trim();

		if (!text) return;

		this.dispatchEvent(
			new CustomEvent('send-message', {
				detail: {
					contactId: this.contact.id,
					text,
				},
				bubbles: true,
				composed: true,
			})
		);

		input.value = '';
	}

	render() {
		// Пустое состояние — контакт не выбран
		if (!this.contact) {
			return html`
				<div class="empty-state">
					<div class="empty-state-icon">💬</div>
					<div class="empty-state-title">Выберите контакт</div>
					<div class="empty-state-text">
						Выберите контакт из списка слева, чтобы начать общение
					</div>
				</div>
			`;
		}

		const { username, avatar, bio, isOnline, lastSeen } = this.contact;
		const displayName = username || 'Неизвестный пользователь';

		return html`
			<!-- Header -->
			<div class="chat-header">
				<button class="back-btn" @click=${this._handleBack}>←</button>
				<div class="avatar">
					${avatar
						? html`<img src=${avatar} alt=${displayName} />`
						: this._getInitials(displayName)}
				</div>
				<div class="contact-info">
					<div class="contact-name">${displayName}</div>
					<div class="contact-status ${isOnline ? 'online' : ''}">
						${isOnline ? 'онлайн' : this._formatLastSeen(lastSeen)}
					</div>
				</div>
			</div>

			<!-- Delete confirmation overlay -->
			${this._showDeleteConfirm
				? html`
						<div class="delete-confirm">
							<div class="delete-confirm-icon">⚠️</div>
							<div class="delete-confirm-title">Удалить контакт?</div>
							<div class="delete-confirm-text">
								Вы уверены, что хотите удалить
								<strong>${displayName}</strong>? <br /><br />
								Контакт будет заблокирован и не сможет снова отправить вам
								запрос. Это действие нельзя отменить.
							</div>
							<div class="delete-confirm-actions">
								<button
									class="btn btn-secondary"
									@click=${this._handleDeleteCancel}
								>
									Отмена
								</button>
								<button
									class="btn btn-danger"
									@click=${this._handleDeleteConfirm}
								>
									Удалить и заблокировать
								</button>
							</div>
						</div>
				  `
				: html`
						<!-- Messages placeholder -->
						<div class="chat-messages">
							<div class="placeholder-icon">🚀</div>
							<div class="placeholder-title">Начните общение!</div>
							<div class="placeholder-text">
								Отправьте первое сообщение, чтобы начать переписку с
								${displayName}
							</div>
							${bio ? html`<div class="contact-bio">"${bio}"</div>` : ''}
						</div>

						<!-- Input -->
						<div class="chat-input">
							<div class="input-wrapper">
								<input
									type="text"
									class="input-field"
									placeholder="Написать сообщение..."
									@keydown=${this._handleInputKeydown}
								/>
								<button class="send-btn" @click=${this._handleSend}>➤</button>
							</div>
						</div>

						<!-- Footer with delete -->
						<div class="chat-footer">
							<a class="delete-link" @click=${this._handleDeleteClick}>
								🗑️ Удалить контакт
							</a>
						</div>
				  `}
		`;
	}
}

customElements.define('chat-placeholder', ChatPlaceholder);
