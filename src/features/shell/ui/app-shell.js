// src/features/shell/ui/app-shell.js
import { LitElement, html } from 'lit';
import { appShellStyles } from './app-shell.css.js';
import { eventBus } from '../../../core/event-bus.js';

// Импортируем компоненты
import './components/loading-screen.js';
import './components/auth-wrapper.js';
import './components/top-bar.js';
import './components/sidebar-panel.js';
import './screens/contacts-screen.js';
import './screens/chat-screen.js';

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
		_profile: { state: true },
	};

	static styles = appShellStyles;

	constructor() {
		super();
		this._authState = 'initializing';
		this._shellState = 'loading';
		this._username = null;
		this._currentScreen = 'settings';
		this._activeContactId = null;
		this._profile = null;

		this._settingsActor = null;
		this._authSubscription = null;
		this._shellSubscription = null;
		this._settingsSubscription = null;

		this._onSettingsReady = this._onSettingsReady.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		this._subscribeToActors();
		eventBus.on('SETTINGS_READY', this._onSettingsReady);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._authSubscription?.unsubscribe();
		this._shellSubscription?.unsubscribe();
		this._settingsSubscription?.unsubscribe();
		eventBus.off('SETTINGS_READY', this._onSettingsReady);
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
	}

	// === Actor Subscriptions ===

	_onSettingsReady(event) {
		if (event.actor) {
			console.log('🐚 Shell: Settings actor ready');
			this._connectToSettingsActor(event.actor);
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

		this._tryConnectInitialSettings();
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

	_tryConnectInitialSettings() {
		if (this._settingsActor) return;

		const settingsResult = this.featureRegistry?.getMountResult('settings');
		if (!settingsResult) return;

		// Settings может быть null если пользователь не аутентифицирован
		const actor = settingsResult.actor || settingsResult.getActor?.() || null;
		if (actor) {
			this._connectToSettingsActor(actor);
		}
	}

	_connectToSettingsActor(actor) {
		if (this._settingsActor === actor) return;

		this._settingsActor = actor;
		this._settingsSubscription?.unsubscribe();

		const snapshot = actor.getSnapshot();
		this._profile = snapshot.context.profile;

		this._settingsSubscription = actor.subscribe((snapshot) => {
			this._profile = snapshot.context.profile;
			this.requestUpdate();
		});

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
		return html`
			<div class="app-container">
				<sidebar-panel
					.profile=${this._profile}
					.username=${this._username}
					@navigate-settings=${this._handleNavigateToSettings}
					@add-contact=${this._handleAddContact}
				></sidebar-panel>

				<div class="main-content">
					<top-bar
						.currentScreen=${this._currentScreen}
						@logout=${this._handleLogout}
					></top-bar>

					<div class="content-area">${this._renderContent()}</div>
				</div>
			</div>
		`;
	}

	_renderContent() {
		switch (this._currentScreen) {
			case 'settings':
				return this._renderSettings();
			case 'contactsList':
				return html`<contacts-screen></contacts-screen>`;
			case 'chat':
				return html`<chat-screen
					.contactId=${this._activeContactId}
				></chat-screen>`;
			default:
				return html`<div>Экран не найден</div>`;
		}
	}

	_renderSettings() {
		// Ленивый импорт settings-view
		import('../../settings/ui/settings-view.js');

		if (!this._settingsActor) {
			return html`<loading-screen
				message="Загрузка профиля..."
			></loading-screen>`;
		}

		// Теперь this.actorRegistry будет определен (если передан в app-shell)
		return html`
			<settings-view
				.settingsActor=${this._settingsActor}
				.actorRegistry=${this.actorRegistry}
			></settings-view>
		`;
	}

	// === Event Handlers ===

	_handleNavigateToSettings() {
		this.shellActor?.send({ type: 'NAVIGATE_TO_SETTINGS' });
	}

	_handleAddContact() {
		alert('Добавление контакта — скоро будет реализовано!');
	}

	_handleLogout() {
		this.authActor?.send({ type: 'LOGOUT' });
	}
}

customElements.define('app-shell', AppShell);
