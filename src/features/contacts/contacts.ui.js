// src/features/contacts/contacts.ui.js

import { ContactsView } from './ui/index.js';

/**
 * UI контроллер для контактов
 * Связывает ContactsView с actor и обрабатывает события
 */
export class ContactsUI {
	constructor(actor, container, eventBus) {
		this.actor = actor;
		this.container = container;
		this.eventBus = eventBus;
		this.view = null;
	}

	mount() {
		// Создаём view
		this.view = new ContactsView();

		// Подписываемся на события от view
		this.view.addEventListener('add-contact', (e) => {
			this.actor.send({
				type: 'ADD_CONTACT',
				data: e.detail,
			});
		});

		this.view.addEventListener('accept-contact-submit', (e) => {
			this.actor.send({
				type: 'ACCEPT_CONTACT',
				contactId: e.detail.contactId,
				group: e.detail.group,
			});
		});

		this.view.addEventListener('reject-contact', (e) => {
			this.actor.send({
				type: 'REJECT_CONTACT',
				contactId: e.detail.contactId,
			});
		});

		this.view.addEventListener('cancel-outgoing', (e) => {
			this.actor.send({
				type: 'CANCEL_OUTGOING',
				contactId: e.detail.contactId,
			});
		});

		this.view.addEventListener('open-chat', (e) => {
			this.eventBus?.dispatch({
				type: 'OPEN_CHAT',
				contactId: e.detail.contactId,
			});
		});

		this.view.addEventListener('navigate-profile', () => {
			this.eventBus?.dispatch({
				type: 'NAVIGATE_TO_PROFILE',
			});
		});

		// Подписываемся на изменения в actor
		this.subscription = this.actor.subscribe((state) => {
			this._updateView(state);
		});

		// Первоначальный рендер
		this._updateView(this.actor.getSnapshot());

		// Монтируем в DOM
		this.container.appendChild(this.view);

		console.log('📇 ContactsUI mounted');
	}

	unmount() {
		if (this.subscription) {
			this.subscription.unsubscribe();
		}

		if (this.view && this.view.parentNode) {
			this.view.parentNode.removeChild(this.view);
		}

		this.view = null;

		console.log('📇 ContactsUI unmounted');
	}

	_updateView(state) {
		if (!this.view) return;

		this.view.contacts = state.context.contacts || [];
		this.view.groups = state.context.groups || [];
		this.view.loading = state.matches('loading');

		// TODO: получить профиль из identity/auth
		// Временно используем заглушку
		this.view.profile = {
			username: 'Current User',
			avatar: null,
			bio: 'Hey there! I am using P2P Chat',
		};
	}
}
