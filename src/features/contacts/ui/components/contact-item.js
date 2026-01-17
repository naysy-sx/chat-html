// src/features/contacts/ui/components/contact-item.js

import { LitElement, html, css } from 'lit';

export class ContactItem extends LitElement {
	static properties = {
		contact: { type: Object },
	};

	static styles = css`
		:host {
			display: block;
		}

		.contact-item {
			display: flex;
			align-items: center;
			gap: var(--space-3, 12px);
			padding: var(--space-3, 12px) var(--space-4, 16px);
			cursor: pointer;
			transition: background 0.15s;
			position: relative;
			border-bottom: 1px solid var(--border-color, #e5e5e5);
		}

		.contact-item:hover {
			background: var(--color-surface-raised, #f5f5f5);
		}

		.contact-item.active {
			background: var(--color-primary-soft, rgba(122, 92, 255, 0.08));
			border-left: 3px solid var(--color-primary, #7a5cff);
		}

		.avatar {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: var(--color-primary, #7a5cff);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: 600;
			font-size: 1.125rem;
			flex-shrink: 0;
			position: relative;
			overflow: hidden;
		}

		.avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.online-indicator {
			position: absolute;
			bottom: 0;
			right: 0;
			width: 12px;
			height: 12px;
			background: var(--color-success, #34d399);
			border: 2px solid var(--color-surface, #fff);
			border-radius: 50%;
		}

		.contact-info {
			flex: 1;
			min-width: 0;
		}

		.contact-name {
			font-weight: 500;
			font-size: 0.9375rem;
			margin-bottom: 2px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: var(--color-text-main, #1a1a1a);
		}

		.contact-bio {
			font-size: 0.8125rem;
			color: var(--color-text-muted, #666);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.last-message {
			font-size: 0.8125rem;
			color: var(--color-text-muted, #666);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.last-message.unread {
			font-weight: 600;
			color: var(--color-text-main, #1a1a1a);
		}

		.pending-label {
			font-size: 0.75rem;
			color: var(--color-warning, #f59e0b);
			font-style: italic;
		}

		.contact-meta {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 4px;
			flex-shrink: 0;
		}

		.timestamp {
			font-size: 0.75rem;
			color: var(--color-text-muted, #666);
		}

		.unread-badge {
			background: var(--color-primary, #7a5cff);
			color: white;
			font-size: 0.6875rem;
			font-weight: 600;
			padding: 2px 6px;
			border-radius: 10px;
			min-width: 20px;
			text-align: center;
		}

		/* Кнопки действий */
		.pending-actions {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(4px);
			display: flex;
			align-items: center;
			justify-content: center;
			gap: var(--space-2, 8px);
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
		}

		.contact-item:hover .pending-actions {
			opacity: 1;
			pointer-events: all;
		}

		.action-btn {
			padding: 8px 16px;
			border: none;
			border-radius: var(--radius-m, 8px);
			font-weight: 500;
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.action-btn.accept {
			background: var(--color-success, #34d399);
			color: white;
		}

		.action-btn.accept:hover {
			background: #2eb88a;
		}

		.action-btn.reject {
			background: var(--color-danger, #ef4444);
			color: white;
		}

		.action-btn.reject:hover {
			background: #dc2626;
		}

		.action-btn.cancel {
			background: var(--color-surface, #f5f5f5);
			color: var(--color-text-main, #1a1a1a);
			border: 1px solid var(--border-color, #e5e5e5);
		}

		.action-btn.cancel:hover {
			background: var(--color-bg-hover, #eee);
		}
	`;

	constructor() {
		super();
		this.contact = null;
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

	_formatTimestamp(timestamp) {
		if (!timestamp) return '';

		const now = Date.now();
		const diff = now - timestamp;

		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'сейчас';
		if (minutes < 60) return `${minutes}м`;
		if (hours < 24) return `${hours}ч`;
		if (days < 7) return `${days}д`;

		const date = new Date(timestamp);
		return date.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
		});
	}

	_handleClick(e) {
		if (e.target.closest('.pending-actions')) return;

		this.dispatchEvent(
			new CustomEvent('contact-click', {
				detail: { contact: this.contact },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleAccept(e) {
		e.stopPropagation();
		this.dispatchEvent(
			new CustomEvent('contact-accept', {
				detail: { contact: this.contact },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleReject(e) {
		e.stopPropagation();
		this.dispatchEvent(
			new CustomEvent('contact-reject', {
				detail: { contact: this.contact },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleCancel(e) {
		e.stopPropagation();
		this.dispatchEvent(
			new CustomEvent('contact-cancel', {
				detail: { contact: this.contact },
				bubbles: true,
				composed: true,
			})
		);
	}

	render() {
		if (!this.contact) return html``;

		const {
			username,
			avatar,
			bio,
			isOnline,
			lastMessage,
			unreadCount,
			lastSeen,
			status,
			addedAt,
		} = this.contact;

		const isIncoming = status === 'pending_incoming';
		const isOutgoing = status === 'pending_outgoing';
		const isAccepted = status === 'accepted';

		// Отображаемое имя — реальное имя контакта или placeholder
		const displayName = username || 'Неизвестный пользователь';

		return html`
			<div class="contact-item" @click=${this._handleClick}>
				<div class="avatar">
					${avatar
						? html`<img src=${avatar} alt=${displayName} />`
						: html`${this._getInitials(displayName)}`}
					${isOnline ? html`<div class="online-indicator"></div>` : ''}
				</div>

				<div class="contact-info">
					<div class="contact-name">${displayName}</div>

					${isAccepted && lastMessage
						? html`
								<div class="last-message ${unreadCount > 0 ? 'unread' : ''}">
									${lastMessage.text}
								</div>
						  `
						: isAccepted && bio
						? html`<div class="contact-bio">${bio}</div>`
						: isIncoming
						? html`<div class="pending-label">Хочет добавить вас</div>`
						: isOutgoing
						? html`<div class="pending-label">Ожидание ответа...</div>`
						: html`<div class="contact-bio">${bio || ''}</div>`}
				</div>

				<div class="contact-meta">
					${lastMessage
						? html`<div class="timestamp">
								${this._formatTimestamp(lastMessage.timestamp)}
						  </div>`
						: lastSeen
						? html`<div class="timestamp">
								${this._formatTimestamp(lastSeen)}
						  </div>`
						: addedAt
						? html`<div class="timestamp">
								${this._formatTimestamp(addedAt)}
						  </div>`
						: ''}
					${unreadCount > 0
						? html`<div class="unread-badge">${unreadCount}</div>`
						: ''}
				</div>

				<!-- Кнопки для входящих запросов -->
				${isIncoming
					? html`
							<div class="pending-actions">
								<button class="action-btn accept" @click=${this._handleAccept}>
									Принять
								</button>
								<button class="action-btn reject" @click=${this._handleReject}>
									Отклонить
								</button>
							</div>
					  `
					: ''}

				<!-- Кнопка для исходящих запросов -->
				${isOutgoing
					? html`
							<div class="pending-actions">
								<button class="action-btn cancel" @click=${this._handleCancel}>
									Отменить
								</button>
							</div>
					  `
					: ''}
			</div>
		`;
	}
}

customElements.define('contact-item', ContactItem);
