// src/features/shell/ui/screens/contacts-screen.js
import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../../../../shared/ui/index.js';
import '../../../contacts/ui/components/add-contact-dialog.js';
import '../../../contacts/ui/components/contact-item.js';

export class ContactsScreen extends LitElement {
	static properties = {
		contactsActor: { type: Object },
		currentUserId: { type: String },
		_showAddDialog: { state: true },
		_contacts: { state: true },
		_activeContactId: { state: true },
	};

	static styles = [
		buttonStyles,
		css`
			:host {
				display: block;
				height: 100%;
				overflow-y: auto;
			}

			.contacts-container {
				max-width: 800px;
				margin: 0 auto;
				padding: var(--space-l);
			}

			.header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: var(--space-l);
			}

			.title {
				font-size: var(--text-2xl);
				font-weight: 600;
				color: var(--color-text-main);
				margin: 0;
			}

			.group-section {
				margin-bottom: var(--space-l);
			}

			.group-header {
				font-size: var(--text-sm);
				font-weight: 600;
				color: var(--color-text-muted);
				text-transform: uppercase;
				letter-spacing: 0.5px;
				padding: var(--space-s) 0;
				border-bottom: 1px solid var(--color-border);
				margin-bottom: var(--space-s);
				display: flex;
				align-items: center;
				gap: var(--space-s);
			}

			.pending-badge {
				background: var(--color-warning, #f59e0b);
				color: white;
				font-size: 0.6875rem;
				padding: 2px 8px;
				border-radius: 12px;
			}

			.contacts-list {
				display: flex;
				flex-direction: column;
				gap: var(--space-s);
			}

			.empty-state {
				padding: var(--space-2xl);
				text-align: center;
				color: var(--color-text-muted);
			}

			.empty-state h3 {
				margin: 0 0 var(--space-s);
				color: var(--color-text-main);
			}

			contact-item {
				cursor: pointer;
			}

			contact-item.active {
				background: var(--color-primary-soft, rgba(122, 92, 255, 0.1));
				border-radius: var(--radius-m);
			}
		`,
	];

	constructor() {
		super();
		this._showAddDialog = false;
		this._contacts = [];
		this._activeContactId = null;
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
		this._activeContactId = snapshot.context?.activeContactId;

		this._contactsSubscription = this.contactsActor.subscribe((snapshot) => {
			this._contacts = snapshot.context?.contacts || [];
			this._activeContactId = snapshot.context?.activeContactId;
			this.requestUpdate();
		});
	}

	_groupContacts() {
		const grouped = {
			incoming: [],
			outgoing: [],
			accepted: [],
		};

		this._contacts.forEach((contact) => {
			if (contact.status === 'pending_incoming') {
				grouped.incoming.push(contact);
			} else if (contact.status === 'pending_outgoing') {
				grouped.outgoing.push(contact);
			} else if (contact.status === 'accepted') {
				grouped.accepted.push(contact);
			}
		});

		grouped.accepted.sort((a, b) => {
			const aTime = a.lastMessage?.timestamp || a.lastSeen || 0;
			const bTime = b.lastMessage?.timestamp || b.lastSeen || 0;
			return bTime - aTime;
		});

		return grouped;
	}

	render() {
		const grouped = this._groupContacts();
		const hasContacts = this._contacts.length > 0;

		return html`
			<div class="contacts-container">
				<div class="header">
					<h2 class="title">Контакты</h2>
					<button class="btn btn--primary" @click=${this._handleAddContact}>
						➕ Добавить контакт
					</button>
				</div>

				${!hasContacts
					? html`
							<div class="empty-state">
								<h3>📇 У вас нет контактов</h3>
								<p>Добавьте первый контакт, чтобы начать общение</p>
							</div>
					  `
					: html`
							<!-- Входящие запросы -->
							${grouped.incoming.length > 0
								? html`
										<div class="group-section">
											<div class="group-header">
												📥 Входящие запросы
												<span class="pending-badge"
													>${grouped.incoming.length}</span
												>
											</div>
											<div class="contacts-list">
												${grouped.incoming.map(
													(contact) => html`
														<contact-item
															.contact=${contact}
															@contact-accept=${this._handleContactAccept}
															@contact-reject=${this._handleContactReject}
														></contact-item>
													`
												)}
											</div>
										</div>
								  `
								: ''}

							<!-- Исходящие запросы -->
							${grouped.outgoing.length > 0
								? html`
										<div class="group-section">
											<div class="group-header">
												📤 Исходящие запросы
												<span class="pending-badge"
													>${grouped.outgoing.length}</span
												>
											</div>
											<div class="contacts-list">
												${grouped.outgoing.map(
													(contact) => html`
														<contact-item
															.contact=${contact}
															@contact-cancel=${this._handleContactCancel}
														></contact-item>
													`
												)}
											</div>
										</div>
								  `
								: ''}

							<!-- Принятые контакты -->
							${grouped.accepted.length > 0
								? html`
										<div class="group-section">
											<div class="group-header">
												👥 Мои контакты (${grouped.accepted.length})
											</div>
											<div class="contacts-list">
												${grouped.accepted.map(
													(contact) => html`
														<contact-item
															class="${this._activeContactId === contact.id
																? 'active'
																: ''}"
															.contact=${contact}
															@contact-click=${this._handleContactClick}
														></contact-item>
													`
												)}
											</div>
										</div>
								  `
								: ''}
					  `}

				<add-contact-dialog
					?open=${this._showAddDialog}
					.currentUserId=${this.currentUserId}
					@dialog-close=${() => {
						this._showAddDialog = false;
					}}
					@add-contact=${this._handleAddContactSubmit}
				></add-contact-dialog>
			</div>
		`;
	}

	_handleAddContact() {
		this._showAddDialog = true;
	}

	_handleAddContactSubmit(e) {
		const { userId, exchangePublicKey, username, group } = e.detail || {};

		if (!this.contactsActor) {
			console.error('❌ Contacts actor not available');
			return;
		}

		this.contactsActor.send({
			type: 'ADD_CONTACT',
			data: {
				userId: userId || null,
				exchangePublicKey: exchangePublicKey || null,
				username: username || null,
				group: group || null,
			},
		});

		this._showAddDialog = false;
	}

	_handleContactAccept(e) {
		const { contact } = e.detail;

		if (!this.contactsActor) return;

		this.contactsActor.send({
			type: 'ACCEPT_CONTACT',
			contactId: contact.id,
			group: 'Default',
		});
	}

	_handleContactReject(e) {
		const { contact } = e.detail;

		if (!this.contactsActor) return;

		this.contactsActor.send({
			type: 'REJECT_CONTACT',
			contactId: contact.id,
		});
	}

	_handleContactCancel(e) {
		const { contact } = e.detail;

		if (!this.contactsActor) return;

		this.contactsActor.send({
			type: 'CANCEL_OUTGOING',
			contactId: contact.id,
		});
	}

	_handleContactClick(e) {
		const { contact } = e.detail;

		if (this.contactsActor) {
			this.contactsActor.send({
				type: 'SELECT_CONTACT',
				contactId: contact.id,
			});
		}

		this.dispatchEvent(
			new CustomEvent('open-chat', {
				detail: { contactId: contact.id, contact },
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('contacts-screen', ContactsScreen);
