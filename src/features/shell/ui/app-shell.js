// src/features/shell/ui/app-shell.js
import { LitElement, html } from 'lit';
import { appShellStyles } from './app-shell.css.js';
import { eventBus } from '../../../core/event-bus.js';

// Импортируем компоненты
import './components/loading-screen.js';
import './components/auth-wrapper.js';
import './components/top-bar.js';
import './components/sidebar-panel.js';

// Импортируем экраны
import './screens/messages-screen.js';
import './screens/contacts-screen.js';
import './screens/journal-screen.js';
import './screens/discovery-screen.js';
import './screens/settings-screen.js';
import './screens/profile-screen.js';
import './screens/files-screen.js';
import './screens/chat-screen.js';

// Импортируем chat-placeholder
import '../../contacts/ui/components/chat-placeholder.js';

export class AppShell extends LitElement {
	static properties = {
		authActor: { type: Object },
		shellActor: { type: Object },
		featureRegistry: { type: Object },
		actorRegistry: { type: Object },

		_authState: { state: true },
		_shellState: { state: true },
		_username: { state: true },
		_currentScreen: { state: true },
		_activeContactId: { state: true },
		_activeContact: { state: true },
		_profile: { state: true },
		_userId: { state: true },
		_contacts: { state: true },
		_navigationItems: { state: true },
	};

	static styles = appShellStyles;

	constructor() {
		super();
		this._authState = 'initializing';
		this._shellState = 'loading';
		this._username = null;
		this._currentScreen = 'messages';
		this._activeContactId = null;
		this._activeContact = null;
		this._profile = null;
		this._userId = null;
		this._contacts = [];
		this._navigationItems = [];

		this._profileActor = null;
		this._contactsActor = null;
		this._signalingActor = null;
		this._appSettingsActor = null;

		this._authSubscription = null;
		this._shellSubscription = null;
		this._profileSubscription = null;
		this._contactsSubscription = null;
		this._signalingSubscription = null;
		this._appSettingsSubscription = null;

		this._onProfileReady = this._onProfileReady.bind(this);
		this._onContactsReady = this._onContactsReady.bind(this);
		this._onAppSettingsReady = this._onAppSettingsReady.bind(this);
		this._onOpenChat = this._onOpenChat.bind(this);
		this._onNavigate = this._onNavigate.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		this._subscribeToActors();
		eventBus.on('PROFILE_READY', this._onProfileReady);
		eventBus.on('CONTACTS_READY', this._onContactsReady);
		eventBus.on('APP_SETTINGS_READY', this._onAppSettingsReady);
		this.addEventListener('open-chat', this._onOpenChat);
		this.addEventListener('navigate', this._onNavigate);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._authSubscription?.unsubscribe();
		this._shellSubscription?.unsubscribe();
		this._profileSubscription?.unsubscribe();
		this._contactsSubscription?.unsubscribe();
		this._signalingSubscription?.unsubscribe();
		this._appSettingsSubscription?.unsubscribe();

		eventBus.off('PROFILE_READY', this._onProfileReady);
		eventBus.off('CONTACTS_READY', this._onContactsReady);
		eventBus.off('APP_SETTINGS_READY', this._onAppSettingsReady);
		this.removeEventListener('open-chat', this._onOpenChat);
		this.removeEventListener('navigate', this._onNavigate);
	}

	updated(changedProperties) {
		if (
			(changedProperties.has('authActor') ||
				changedProperties.has('shellActor')) &&
			this.authActor &&
			this.shellActor
		) {
			this._subscribeToActors();
		}

		if (
			changedProperties.has('_activeContactId') ||
			changedProperties.has('_contacts')
		) {
			this._updateActiveContact();
		}
	}

	_updateActiveContact() {
		if (!this._activeContactId || !this._contacts.length) {
			this._activeContact = null;
			return;
		}

		this._activeContact =
			this._contacts.find((c) => c.id === this._activeContactId) || null;
	}

	// === Actor Subscriptions ===

	_onProfileReady(event) {
		console.log(
			'📡 app-shell: PROFILE_READY received, actor:',
			event.actor ? 'exists' : 'NULL'
		);
		if (event.actor) {
			console.log('🚀 Shell: Profile actor ready');
			this._connectToProfileActor(event.actor);
		} else {
			console.warn('⚠️ PROFILE_READY event but actor is null!');
		}
	}

	_onContactsReady(event) {
		console.log(
			'🚀 CONTACTS_READY received, event.actor:',
			event.actor ? 'exists' : 'NULL'
		);
		if (event.actor) {
			console.log('🚀 Shell: Contacts actor ready');
			this._connectToContactsActor(event.actor);
		} else {
			console.error('❌ CONTACTS_READY event but actor is null');
		}
	}

	_onAppSettingsReady(event) {
		console.log(
			'📡 app-shell: APP_SETTINGS_READY received, actor:',
			event.actor ? 'exists' : 'NULL'
		);
		if (event.actor) {
			console.log('🚀 Shell: AppSettings actor ready');
			this._connectToAppSettingsActor(event.actor);
		}
	}

	_onOpenChat(event) {
		const { contactId, contact } = event.detail || {};

		console.log('🚀 Shell: Opening chat with', contactId?.slice(0, 16));

		if (contactId) {
			this._activeContactId = contactId;
			if (contact) {
				this._activeContact = contact;
			}
			this._currentScreen = 'chat';

			this.shellActor?.send({
				type: 'NAVIGATE_TO_CHAT',
				contactId,
			});
		}
	}

	_onNavigate(event) {
		const { screen } = event.detail || {};

		if (!screen) return;

		console.log('🚀 Shell: Navigate to', screen);

		this._currentScreen = screen;

		const eventMap = {
			messages: 'NAVIGATE_TO_MESSAGES',
			contacts: 'NAVIGATE_TO_CONTACTS',
			journal: 'NAVIGATE_TO_JOURNAL',
			discovery: 'NAVIGATE_TO_DISCOVERY',
			settings: 'NAVIGATE_TO_SETTINGS',
			profile: 'NAVIGATE_TO_PROFILE',
			files: 'NAVIGATE_TO_FILES',
		};

		const eventType = eventMap[screen];
		if (eventType) {
			this.shellActor?.send({ type: eventType });
		}
	}

	_subscribeToActors() {
		// Auth Actor
		if (this.authActor) {
			this._authSubscription?.unsubscribe();
			const snapshot = this.authActor.getSnapshot();
			this._authState = snapshot.value;
			this._username = snapshot.context.username;

			this._authSubscription = this.authActor.subscribe((snapshot) => {
				this._authState = snapshot.value;
				this._username = snapshot.context.username;
			});
		}

		// Shell Actor
		if (this.shellActor) {
			this._shellSubscription?.unsubscribe();
			this._updateFromShellSnapshot(this.shellActor.getSnapshot());

			this._shellSubscription = this.shellActor.subscribe((snapshot) => {
				this._updateFromShellSnapshot(snapshot);
			});
		}

		this._tryConnectInitialProfile();
		this._tryConnectInitialAppSettings();
		this._tryConnectSignaling();
	}

	_tryConnectSignaling() {
		if (this._signalingActor) return;

		const signalingResult = this.featureRegistry?.getMountResult('signaling');
		if (!signalingResult) return;

		const actor = signalingResult.actor || signalingResult.getActor?.() || null;
		if (actor) {
			this._connectToSignalingActor(actor);
		}
	}

	_connectToSignalingActor(actor) {
		if (this._signalingActor === actor) return;

		this._signalingActor = actor;
		this._signalingSubscription?.unsubscribe();

		const snapshot = actor.getSnapshot();
		this._userId = snapshot.context.userId;

		this._signalingSubscription = actor.subscribe((snapshot) => {
			this._userId = snapshot.context.userId;
			this.requestUpdate();
		});
	}

	_updateFromShellSnapshot(snapshot) {
		let state = snapshot.value;
		if (typeof state === 'object' && state.authenticated) {
			state = `authenticated.${state.authenticated}`;
		}
		this._shellState = state;
		this._currentScreen = snapshot.context.currentScreen;
		this._activeContactId = snapshot.context.activeContactId;
	}

	_tryConnectInitialProfile() {
		if (this._profileActor) return;

		const profileResult = this.featureRegistry?.getMountResult('profile');
		if (!profileResult) return;

		const actor = profileResult.actor || profileResult.getActor?.() || null;
		if (actor) {
			this._connectToProfileActor(actor);
		}
	}

	_connectToProfileActor(actor) {
		if (this._profileActor === actor) return;

		this._profileActor = actor;
		this._profileSubscription?.unsubscribe();

		const snapshot = actor.getSnapshot();
		this._profile = snapshot.context.profile;

		this._profileSubscription = actor.subscribe((snapshot) => {
			this._profile = snapshot.context.profile;
			this.requestUpdate();
		});

		this.requestUpdate();
	}

	_tryConnectInitialAppSettings() {
		if (this._appSettingsActor) return;

		const appSettingsResult =
			this.featureRegistry?.getMountResult('app-settings');
		if (!appSettingsResult) return;

		const actor =
			appSettingsResult.actor || appSettingsResult.getActor?.() || null;
		if (actor) {
			this._connectToAppSettingsActor(actor);
		}
	}

	_connectToAppSettingsActor(actor) {
		if (this._appSettingsActor === actor) return;

		this._appSettingsActor = actor;
		this._appSettingsSubscription?.unsubscribe();

		const snapshot = actor.getSnapshot();
		this._navigationItems = snapshot.context.settings?.navigation?.items || [];

		console.log('⚙️ Initial navigation items:', this._navigationItems.length);

		this._appSettingsSubscription = actor.subscribe((snapshot) => {
			this._navigationItems =
				snapshot.context.settings?.navigation?.items || [];
			console.log('⚙️ Navigation items updated:', this._navigationItems.length);
			this.requestUpdate();
		});

		this.requestUpdate();
	}

	_connectToContactsActor(actor) {
		console.log(
			'🚀 _connectToContactsActor called, actor:',
			actor ? 'exists' : 'NULL'
		);
		if (!actor) {
			console.warn('🚀 _connectToContactsActor: actor is NULL!');
			return;
		}

		if (this._contactsActor === actor) {
			console.log('🚀 Same actor, skipping');
			return;
		}

		console.log('🚀 Setting _contactsActor and subscribing...');
		this._contactsActor = actor;
		this._contactsSubscription?.unsubscribe();

		const snapshot = actor.getSnapshot();
		this._contacts = snapshot.context.contacts || [];
		this._activeContactId = snapshot.context.activeContactId;
		console.log('🚀 Initial contacts from actor:', this._contacts.length);
		this._updateActiveContact();

		this._contactsSubscription = actor.subscribe((snapshot) => {
			console.log(
				'🚀 app-shell: contactsActor snapshot, contacts:',
				snapshot.context.contacts?.length || 0
			);
			this._contacts = snapshot.context.contacts || [];
			this._activeContactId = snapshot.context.activeContactId;
			this._updateActiveContact();
			this.requestUpdate();
		});

		console.log('🚀 Contacts actor connected, calling requestUpdate');
		this.requestUpdate();
	}

	// === Render ===

	render() {
		// Loading state
		if (this._authState === 'initializing' || this._shellState === 'loading') {
			return html`<loading-screen message="Загрузка..."></loading-screen>`;
		}

		// Auth states
		if (this._isAuthState()) {
			return html`<auth-wrapper .authActor=${this.authActor}></auth-wrapper>`;
		}

		// Authenticated
		if (this._authState === 'authenticated') {
			return this._renderApp();
		}

		return html`<loading-screen></loading-screen>`;
	}

	_isAuthState() {
		return ['guest', 'loggingIn', 'registering'].includes(this._authState);
	}

	_renderApp() {
		console.log(
			'🚀 _renderApp() called, _contactsActor:',
			this._contactsActor ? 'exists' : 'NULL',
			this._contactsActor?.id || ''
		);
		return html`
			<div class="app-container">
				<sidebar-panel
					.profile=${this._profile}
					.username=${this._username}
					.currentUserId=${this._userId}
					.currentScreen=${this._currentScreen}
					.navigationItems=${this._navigationItems}
					@logout=${this._handleLogout}
				></sidebar-panel>

				<div class="main-content">
					<top-bar
						.currentScreen=${this._currentScreen}
						.activeContact=${this._activeContact}
						@back=${this._handleBack}
					></top-bar>

					<div class="content-area">${this._renderContent()}</div>
				</div>
			</div>
		`;
	}

	_renderContent() {
		switch (this._currentScreen) {
			case 'messages':
				return html`
					<messages-screen
						.contactsActor=${this._contactsActor}
					></messages-screen>
				`;

			case 'contacts':
				return html`
					<contacts-screen
						.contactsActor=${this._contactsActor}
						.currentUserId=${this._userId}
					></contacts-screen>
				`;

			case 'journal':
				return html`<journal-screen></journal-screen>`;

			case 'discovery':
				return html`<discovery-screen></discovery-screen>`;

			case 'settings':
				return html`
					<settings-screen
						.appSettingsActor=${this._appSettingsActor}
					></settings-screen>
				`;

			case 'profile':
				return html`
					<profile-screen
						.profileActor=${this._profileActor}
						.actorRegistry=${this.actorRegistry}
					></profile-screen>
				`;

			case 'files':
				return html`<files-screen></files-screen>`;

			case 'chat':
				return this._renderChat();

			default:
				return html`
					<div style="padding: var(--space-xl); text-align: center;">
						Неизвестный экран: ${this._currentScreen}
					</div>
				`;
		}
	}

	_renderChat() {
		if (!this._activeContact) {
			return html`<chat-placeholder .contact=${null}></chat-placeholder>`;
		}

		return html`
			<chat-placeholder
				.contact=${this._activeContact}
				@close-chat=${this._handleCloseChat}
				@delete-contact=${this._handleDeleteContact}
				@send-message=${this._handleSendMessage}
			></chat-placeholder>
		`;
	}

	// === Event Handlers ===

	_handleBack() {
		this._activeContactId = null;
		this._activeContact = null;
		this._currentScreen = 'contacts';

		this._contactsActor?.send({ type: 'DESELECT_CONTACT' });
	}

	_handleCloseChat() {
		this._activeContactId = null;
		this._activeContact = null;

		this._contactsActor?.send({ type: 'DESELECT_CONTACT' });

		this.requestUpdate();
	}

	_handleDeleteContact(event) {
		const { contactId, block } = event.detail;

		console.log(
			'🚀 Shell: Deleting contact',
			contactId?.slice(0, 16),
			'block:',
			block
		);

		if (block) {
			this._contactsActor?.send({
				type: 'DELETE_AND_BLOCK_CONTACT',
				contactId,
			});
		} else {
			this._contactsActor?.send({
				type: 'DELETE_CONTACT',
				contactId,
			});
		}

		this._handleCloseChat();
	}

	_handleSendMessage(event) {
		const { contactId, text } = event.detail;

		console.log(
			'🚀 Shell: Send message to',
			contactId?.slice(0, 16),
			':',
			text
		);

		// TODO: Интегрировать с chat feature
		alert(`Отправка сообщений пока не реализована.\n\nСообщение: "${text}"`);
	}

	_handleLogout() {
		this.authActor?.send({ type: 'LOGOUT' });
	}
}

customElements.define('app-shell', AppShell);
