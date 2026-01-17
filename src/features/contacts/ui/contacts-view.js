// src/features/contacts/ui/contacts-view.js

import { LitElement, html } from 'lit';
import { contactsViewStyles } from './contacts-view.css.js';
import './components/contact-item.js';
import './components/add-contact-dialog.js';
import './components/accept-contact-dialog.js';

export class ContactsView extends LitElement {
	static properties = {
		contacts: { type: Array },
		groups: { type: Array },
		profile: { type: Object },
		loading: { type: Boolean },
		_showAddDialog: { type: Boolean, state: true },
		_showAcceptDialog: { type: Boolean, state: true },
		_acceptingContact: { type: Object, state: true },
	};

	static styles = contactsViewStyles;

	constructor() {
		super();
		this.contacts = [];
		this.groups = [];
		this.profile = null;
		this.loading = false;
		this._showAddDialog = false;
		this._showAcceptDialog = false;
		this._acceptingContact = null;
	}

	_groupContacts() {
		const grouped = {
			incoming: [],
			outgoing: [],
			byGroup: {},
		};

		this.contacts.forEach((contact) => {
			if (contact.status === 'pending_incoming') {
				grouped.incoming.push(contact);
			} else if (contact.status === 'pending_outgoing') {
				grouped.outgoing.push(contact);
			} else if (contact.status === 'accepted') {
				const group = contact.group || 'Default';
				if (!grouped.byGroup[group]) {
					grouped.byGroup[group] = [];
				}
				grouped.byGroup[group].push(contact);
			}
		});

		// Сортируем контакты в каждой группе по последнему сообщению
		Object.keys(grouped.byGroup).forEach((group) => {
			grouped.byGroup[group].sort((a, b) => {
				const aTime = a.lastMessage?.timestamp || a.lastSeen || 0;
				const bTime = b.lastMessage?.timestamp || b.lastSeen || 0;
				return bTime - aTime;
			});
		});

		return grouped;
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

	_handleAddContact() {
		this._showAddDialog = true;
	}

	_handleContactAccept(e) {
		this._acceptingContact = e.detail.contact;
		this._showAcceptDialog = true;
	}

	_handleContactReject(e) {
		this.dispatchEvent(
			new CustomEvent('reject-contact', {
				detail: { contactId: e.detail.contact.id },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleContactCancel(e) {
		this.dispatchEvent(
			new CustomEvent('cancel-outgoing', {
				detail: { contactId: e.detail.contact.id },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleContactClick(e) {
		const contact = e.detail.contact;

		// Не открываем чат для pending контактов
		if (contact.status !== 'accepted') return;

		this.dispatchEvent(
			new CustomEvent('open-chat', {
				detail: { contactId: contact.id },
				bubbles: true,
				composed: true,
			})
		);
	}

	_handleAddContactSubmit(e) {
		this.dispatchEvent(
			new CustomEvent('add-contact', {
				detail: e.detail,
				bubbles: true,
				composed: true,
			})
		);
		this._showAddDialog = false;
	}

	_handleAcceptContactSubmit(e) {
		this.dispatchEvent(
			new CustomEvent('accept-contact-submit', {
				detail: e.detail,
				bubbles: true,
				composed: true,
			})
		);
		this._showAcceptDialog = false;
		this._acceptingContact = null;
	}

	_handleNavigateProfile() {
		this.dispatchEvent(
			new CustomEvent('navigate-profile', {
				bubbles: true,
				composed: true,
			})
		);
	}

	render() {
		const grouped = this._groupContacts();
		const hasContacts = this.contacts.length > 0;
		const acceptedGroups = Object.keys(grouped.byGroup).sort();

		return html`
			<!-- Sidebar -->
			<aside class="contacts-sidebar">
				<div class="sidebar-header">
					<!-- Профиль пользователя -->
					<div class="user-profile">
						<div class="user-avatar">
							${this.profile?.avatar
								? html`<img
										src=${this.profile.avatar}
										alt=${this.profile.username}
								  />`
								: this._getInitials(this.profile?.username || '')}
						</div>
						<div class="user-info">
							<div class="user-name">${this.profile?.username || 'User'}</div>
							${this.profile?.bio
								? html`<div class="user-bio">${this.profile.bio}</div>`
								: ''}
						</div>
					</div>

					<a
						href="#"
						class="settings-link"
						@click=${this._handleNavigateProfile}
					>
						⚙️ Изменить профиль
					</a>
				</div>

				<!-- Кнопка добавления контакта -->
				<div style="padding: var(--space-4); padding-top: 0;">
					<button class="add-contact-btn" @click=${this._handleAddContact}>
						+ Добавить контакт
					</button>
				</div>

				<!-- Список контактов -->
				<div class="contacts-list">
					${!hasContacts
						? html`
								<div class="empty-state">
									<div class="empty-state-icon">👥</div>
									<div>У вас нет добавленных контактов</div>
								</div>
						  `
						: html`
								<!-- Входящие запросы -->
								${grouped.incoming.length > 0
									? html`
											<div class="group-section">
												<div class="group-header">
													Входящие запросы (${grouped.incoming.length})
												</div>
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
									  `
									: ''}

								<!-- Исходящие запросы -->
								${grouped.outgoing.length > 0
									? html`
											<div class="group-section">
												<div class="group-header">
													Исходящие (${grouped.outgoing.length})
												</div>
												${grouped.outgoing.map(
													(contact) => html`
														<contact-item
															.contact=${contact}
															@contact-cancel=${this._handleContactCancel}
														></contact-item>
													`
												)}
											</div>
									  `
									: ''}

								<!-- Группы контактов -->
								${acceptedGroups.map(
									(group) => html`
										<div class="group-section">
											<div class="group-header">
												${group} (${grouped.byGroup[group].length})
											</div>
											${grouped.byGroup[group].map(
												(contact) => html`
													<contact-item
														.contact=${contact}
														@contact-click=${this._handleContactClick}
													></contact-item>
												`
											)}
										</div>
									`
								)}
						  `}
				</div>
			</aside>

			<!-- Главный контент -->
			<main class="contacts-content">
				<div class="content-placeholder">
					<div class="content-placeholder-icon">💬</div>
					<h2>Выберите контакт</h2>
					<p>Выберите контакт из списка слева, чтобы начать общение</p>
				</div>
			</main>

			<!-- Диалоги -->
			<add-contact-dialog
				?open=${this._showAddDialog}
				.groups=${this.groups}
				@dialog-close=${() => (this._showAddDialog = false)}
				@add-contact=${this._handleAddContactSubmit}
			></add-contact-dialog>

			<accept-contact-dialog
				?open=${this._showAcceptDialog}
				.contact=${this._acceptingContact}
				.groups=${this.groups}
				@dialog-close=${() => {
					this._showAcceptDialog = false;
					this._acceptingContact = null;
				}}
				@accept-contact=${this._handleAcceptContactSubmit}
			></accept-contact-dialog>
		`;
	}
}

customElements.define('contacts-view', ContactsView);
