// src/features/shell/ui/components/sidebar-panel.js
import { LitElement, html, css } from 'lit';
import { avatarStyles, buttonStyles } from '../../../../shared/ui/index.js';
import '../../../contacts/ui/components/add-contact-dialog.js';
import '../../../contacts/ui/components/contact-item.js';

export class SidebarPanel extends LitElement {
	static properties = {
		profile: { type: Object },
		username: { type: String },
		currentUserId: { type: String },
		contactsActor: { type: Object },
		eventBus: { type: Object },
		activeContactId: { type: String },
		_showAddDialog: { state: true },
		_contacts: { state: true },
	};

	static styles = [
		avatarStyles,
		buttonStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				width: 250px;
				min-width: 250px;
				background: var(--color-surface);
				border-right: 1px solid var(--color-border);
				overflow: hidden;
			}

			/* User Section */
			.user-section {
				padding: var(--space-m);
				border-bottom: 1px solid var(--color-border);
			}

			.user-profile {
				display: flex;
				align-items: center;
				gap: var(--space-s);
				margin-bottom: var(--space-s);
			}

			.user-info {
				flex: 1;
				min-width: 0;
			}

			.user-name {
				font-weight: 600;
				color: var(--color-text-main);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.user-bio {
				font-size: var(--text-sm);
				color: var(--color-text-muted);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.settings-link {
				display: block;
				padding: var(--space-xs) var(--space-s);
				color: var(--color-primary);
				text-decoration: none;
				font-size: var(--text-sm);
				border-radius: var(--radius-m);
				transition: background var(--transition-fast);
			}

			.settings-link:hover {
				background: var(--color-bg-hover);
			}

			/* Contacts Section */
			.contacts-section {
				flex: 1;
				overflow-y: auto;
				padding: var(--space-s);
			}

			.section-header {
				font-size: var(--text-xs);
				font-weight: 600;
				color: var(--color-text-muted);
				text-transform: uppercase;
				letter-spacing: 0.5px;
				padding: var(--space-xs) var(--space-s);
				margin-bottom: var(--space-xs);
			}

			.group-header {
				font-size: var(--text-xs);
				font-weight: 600;
				color: var(--color-text-muted);
				padding: var(--space-xs) var(--space-s);
				margin-top: var(--space-s);
				border-top: 1px solid var(--color-border);
			}

			.group-header:first-child {
				margin-top: 0;
				border-top: none;
			}

			.empty-state {
				padding: var(--space-m);
				text-align: center;
				color: var(--color-text-muted);
				font-size: var(--text-sm);
			}

			.contacts-list {
				display: flex;
				flex-direction: column;
				gap: var(--space-xs);
				margin-bottom: var(--space-s);
			}

			.pending-badge {
				background: var(--color-warning, #f59e0b);
				color: white;
				font-size: 0.6875rem;
				padding: 2px 6px;
				border-radius: 10px;
				margin-left: var(--space-xs);
			}

			contact-item {
				cursor: pointer;
			}
			contact-item.active {
				background: var(--color-primary-soft, rgba(122, 92, 255, 0.1));
				border-radius: var(--radius-m);
			}

			.add-contact-btn {
				width: 100%;
				margin-top: var(--space-s);
			}

			@media (max-width: 768px) {
				:host {
					width: 200px;
					min-width: 200px;
				}
			}
		`,
	];

	constructor() {
		super();
		this._showAddDialog = false;
		this._contacts = [];
		this._contactsState = null;
		this._contactsSubscription = null;
	}

	connectedCallback() {
		super.connectedCallback();
		console.log(
			'📇 sidebar-panel: connectedCallback, contactsActor:',
			this.contactsActor ? 'exists' : 'NULL'
		);
		if (this.contactsActor) {
			console.log('📇 sidebar-panel: subscribing from connectedCallback');
			this._subscribeToContacts();
		} else {
			console.warn(
				'📇 sidebar-panel: connectedCallback but contactsActor is NULL'
			);
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		if (this._contactsSubscription) {
			this._contactsSubscription.unsubscribe();
		}
	}

	updated(changedProperties) {
		super.updated(changedProperties);
		if (changedProperties.has('contactsActor')) {
			console.log(
				'📇 sidebar-panel: contactsActor changed to:',
				this.contactsActor ? 'exists' : 'NULL'
			);
			if (this.contactsActor) {
				console.log(
					'📇 sidebar-panel: contactsActor changed, re-subscribing...'
				);
				this._subscribeToContacts();
			}
		}
		if (
			changedProperties.has('contactsActor') &&
			this.contactsActor &&
			!this._contactsSubscription
		) {
			console.log('📇 sidebar-panel: subscribing to contacts');
			this._subscribeToContacts();
		}
	}

	_subscribeToContacts() {
		if (!this.contactsActor) {
			console.warn('⚠️ sidebar-panel: contactsActor not available');
			return;
		}

		console.log('📇 sidebar-panel: subscribing to contactsActor');

		try {
			const initialSnapshot = this.contactsActor.getSnapshot();
			console.log(
				'📇 sidebar-panel: initial snapshot contacts:',
				initialSnapshot.context?.contacts?.length || 0
			);
		} catch (err) {
			console.warn(
				'📇 sidebar-panel: could not get initial snapshot:',
				err.message
			);
		}

		this._contactsSubscription = this.contactsActor.subscribe((snapshot) => {
			console.log(
				'📇 sidebar-panel: received snapshot, state:',
				snapshot.value,
				'contacts:',
				snapshot.context?.contacts?.length || 0
			);

			this._contactsState = snapshot;

			if (Array.isArray(snapshot.context?.contacts)) {
				console.log(
					'📇 sidebar-panel: assigning contacts:',
					snapshot.context.contacts.length
				);
				this._contacts = snapshot.context.contacts;
			} else {
				console.warn(
					'⚠️ sidebar-panel: contacts is not an array:',
					snapshot.context?.contacts
				);
				this._contacts = [];
			}
			if (snapshot.context?.activeContactId !== undefined) {
				this.activeContactId = snapshot.context.activeContactId;
			}
			console.log(
				'📇 sidebar-panel: calling requestUpdate, _contacts now:',
				this._contacts.length
			);
			this.requestUpdate();
		});
	}

	/**
	 * Группировка контактов по статусу
	 */
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

		// Сортируем принятые контакты по последнему сообщению
		grouped.accepted.sort((a, b) => {
			const aTime = a.lastMessage?.timestamp || a.lastSeen || 0;
			const bTime = b.lastMessage?.timestamp || b.lastSeen || 0;
			return bTime - aTime;
		});

		return grouped;
	}

	get _displayName() {
		return this.profile?.displayName || this.username || 'Пользователь';
	}

	get _bio() {
		return this.profile?.bio || 'Кратко о себе';
	}

	get _avatarLetter() {
		return this._displayName[0]?.toUpperCase() || '?';
	}

	render() {
		console.log(
			'📇 sidebar-panel.render() called, _contacts.length:',
			this._contacts.length
		);
		const grouped = this._groupContacts();
		const hasContacts = this._contacts.length > 0;
		console.log('📇 sidebar-panel.render() grouped:', grouped);
		console.log('📇 sidebar-panel.render() hasContacts:', hasContacts);

		return html`
			<!-- User Section -->
			<div class="user-section">
				<div class="user-profile">
					<div class="avatar">
						${this.profile?.avatar
							? html`<img src=${this.profile.avatar} alt="Аватар" />`
							: this._avatarLetter}
					</div>
					<div class="user-info">
						<div class="user-name">${this._displayName}</div>
						<div class="user-bio">${this._bio}</div>
					</div>
				</div>
				<a href="#" class="settings-link" @click=${this._handleProfileClick}>
					⚙️ Изменить настройки
				</a>
			</div>

			<!-- Contacts Section -->
			<div class="contacts-section">
				<div class="section-header">Контакты</div>

				${!hasContacts
					? html`<div class="empty-state">У вас нет добавленных контактов</div>`
					: html`
							<!-- Входящие запросы -->
							${grouped.incoming.length > 0
								? html`
										<div class="group-header">
											📥 Входящие
											<span class="pending-badge"
												>${grouped.incoming.length}</span
											>
										</div>
										<div class="contacts-list">
											${grouped.incoming.map((contact) => {
												console.log(
													'📇 Rendering incoming contact:',
													contact.id
												);
												return html`
													<contact-item
														.contact=${contact}
														@contact-accept=${this._handleContactAccept}
														@contact-reject=${this._handleContactReject}
													></contact-item>
												`;
											})}
										</div>
								  `
								: ''}

							<!-- Исходящие запросы -->
							${grouped.outgoing.length > 0
								? html`
										<div class="group-header">
											📤 Исходящие
											<span class="pending-badge"
												>${grouped.outgoing.length}</span
											>
										</div>
										<div class="contacts-list">
											${grouped.outgoing.map((contact) => {
												console.log(
													'📇 Rendering outgoing contact:',
													contact.id
												);
												return html`
													<contact-item
														.contact=${contact}
														@contact-cancel=${this._handleContactCancel}
													></contact-item>
												`;
											})}
										</div>
								  `
								: ''}

							<!-- Принятые контакты -->
							${grouped.accepted.length > 0
								? html`
										<div class="group-header">
											👥 Контакты (${grouped.accepted.length})
										</div>
										<div class="contacts-list">
											${grouped.accepted.map((contact) => {
												console.log(
													'📇 Rendering accepted contact:',
													contact.id
												);
												return html`
													<contact-item
														.contact=${contact}
														@contact-click=${this._handleContactClick}
													></contact-item>
												`;
											})}
										</div>
								  `
								: ''}
					  `}

				<button
					class="btn btn--primary add-contact-btn"
					@click=${this._handleAddContact}
				>
					➕ Добавить контакт
				</button>

				<add-contact-dialog
					?open=${this._showAddDialog}
					.currentUserId=${this.currentUserId}
					@dialog-close=${() => {
						console.log('🔵 Dialog close event');
						this._showAddDialog = false;
						this.requestUpdate();
					}}
					@add-contact=${this._handleAddContactSubmit}
				></add-contact-dialog>
			</div>
		`;
	}

	_handleProfileClick(e) {
		e.preventDefault();
		this.dispatchEvent(
			new CustomEvent('navigate-profile', {
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleAddContact() {
		console.log('🔵 _handleAddContact called');
		this._showAddDialog = true;
		this.requestUpdate();
	}

	_handleAddContactSubmit(e) {
		const { userId, exchangePublicKey, username, group } = e.detail || {};

		if (!this.contactsActor) {
			console.error('❌ Contacts actor not available');
			return;
		}

		console.log('📇 sidebar-panel: sending ADD_CONTACT', {
			userId: userId?.slice(0, 16),
		});

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

		if (!this.contactsActor) {
			console.error('❌ Contacts actor not available');
			return;
		}

		console.log(
			'📇 sidebar-panel: accepting contact',
			contact.id?.slice(0, 16)
		);

		this.contactsActor.send({
			type: 'ACCEPT_CONTACT',
			contactId: contact.id,
			group: 'Default',
		});
	}

	_handleContactReject(e) {
		const { contact } = e.detail;

		if (!this.contactsActor) {
			console.error('❌ Contacts actor not available');
			return;
		}

		console.log(
			'📇 sidebar-panel: rejecting contact',
			contact.id?.slice(0, 16)
		);

		this.contactsActor.send({
			type: 'REJECT_CONTACT',
			contactId: contact.id,
		});
	}

	// ✅ ДОБАВЛЕН обработчик отмены исходящего запроса
	_handleContactCancel(e) {
		const { contact } = e.detail;

		if (!this.contactsActor) {
			console.error('❌ Contacts actor not available');
			return;
		}

		console.log(
			'📇 sidebar-panel: cancelling outgoing request',
			contact.id?.slice(0, 16)
		);

		this.contactsActor.send({
			type: 'CANCEL_OUTGOING',
			contactId: contact.id,
		});
	}

	_handleContactClick(e) {
		const { contact } = e.detail;

		console.log(
			'📇 sidebar-panel: selecting contact',
			contact.id?.slice(0, 16)
		);

		// ✅ Отправляем в машину
		if (this.contactsActor) {
			this.contactsActor.send({
				type: 'SELECT_CONTACT',
				contactId: contact.id,
			});
		}

		// ✅ Также отправляем событие наверх для app-shell
		this.dispatchEvent(
			new CustomEvent('open-chat', {
				detail: { contactId: contact.id, contact },
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('sidebar-panel', SidebarPanel);
