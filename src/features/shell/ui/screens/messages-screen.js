// src/features/shell/ui/screens/messages-screen.js
import { LitElement, html, css } from 'lit';

export class MessagesScreen extends LitElement {
	static properties = {
		contactsActor: { type: Object },
		_contacts: { state: true },
	};

	static styles = css`
		:host {
			display: block;
			height: 100%;
			overflow-y: auto;
		}

		.messages-container {
			max-width: 800px;
			margin: 0 auto;
			padding: var(--space-l);
		}

		.title {
			font-size: var(--text-2xl);
			font-weight: 600;
			color: var(--color-text-main);
			margin: 0 0 var(--space-l);
		}

		.placeholder {
			padding: var(--space-2xl);
			text-align: center;
			color: var(--color-text-muted);
		}

		.placeholder h3 {
			margin: 0 0 var(--space-s);
			color: var(--color-text-main);
		}

		.message-item {
			display: flex;
			align-items: center;
			gap: var(--space-m);
			padding: var(--space-m);
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-m);
			margin-bottom: var(--space-s);
			cursor: pointer;
			transition: all var(--transition-fast);
		}

		.message-item:hover {
			background: var(--color-bg-hover);
			border-color: var(--color-primary);
		}

		.avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: var(--color-primary);
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 600;
			font-size: var(--text-lg);
			flex-shrink: 0;
		}

		.message-content {
			flex: 1;
			min-width: 0;
		}

		.message-header {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			margin-bottom: var(--space-xs);
		}

		.contact-name {
			font-weight: 600;
			color: var(--color-text-main);
		}

		.message-time {
			font-size: var(--text-sm);
			color: var(--color-text-muted);
		}

		.message-preview {
			color: var(--color-text-muted);
			font-size: var(--text-sm);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	`;

	constructor() {
		super();
		this._contacts = [];
		this._contactsSubscription = null;
	}

	connectedCallback() {
		super.connectedCallback();
		if (this.contactsActor) {
			this._subscribeToContacts();
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._contactsSubscription?.unsubscribe();
	}

	updated(changedProperties) {
		if (changedProperties.has('contactsActor') && this.contactsActor) {
			this._subscribeToContacts();
		}
	}

	_subscribeToContacts() {
		if (!this.contactsActor) return;

		this._contactsSubscription?.unsubscribe();

		const snapshot = this.contactsActor.getSnapshot();
		this._contacts = snapshot.context?.contacts || [];

		this._contactsSubscription = this.contactsActor.subscribe((snapshot) => {
			this._contacts = snapshot.context?.contacts || [];
			this.requestUpdate();
		});
	}

	render() {
		// Фильтруем только принятые контакты с сообщениями
		const contactsWithMessages = this._contacts
			.filter((c) => c.status === 'accepted' && c.lastMessage)
			.sort((a, b) => {
				const aTime = a.lastMessage?.timestamp || 0;
				const bTime = b.lastMessage?.timestamp || 0;
				return bTime - aTime;
			});

		return html`
			<div class="messages-container">
				<h2 class="title">Сообщения</h2>

				${contactsWithMessages.length === 0
					? html`
							<div class="placeholder">
								<h3>💬 Нет сообщений</h3>
								<p>Начните общение с вашими контактами</p>
							</div>
					  `
					: html`
							${contactsWithMessages.map((contact) =>
								this._renderMessage(contact)
							)}
					  `}
			</div>
		`;
	}

	_renderMessage(contact) {
		const avatarLetter = (contact.name ||
			contact.username ||
			'?')[0].toUpperCase();
		const timeStr = contact.lastMessage?.timestamp
			? new Date(contact.lastMessage.timestamp).toLocaleTimeString('ru-RU', {
					hour: '2-digit',
					minute: '2-digit',
			  })
			: '';

		return html`
			<div class="message-item" @click=${() => this._openChat(contact)}>
				<div class="avatar">${avatarLetter}</div>
				<div class="message-content">
					<div class="message-header">
						<span class="contact-name"
							>${contact.name || contact.username}</span
						>
						<span class="message-time">${timeStr}</span>
					</div>
					<div class="message-preview">
						${contact.lastMessage?.text || 'Медиа-сообщение'}
					</div>
				</div>
			</div>
		`;
	}

	_openChat(contact) {
		this.dispatchEvent(
			new CustomEvent('open-chat', {
				detail: { contactId: contact.id, contact },
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('messages-screen', MessagesScreen);
