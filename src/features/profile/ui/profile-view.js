// src/features/profile/ui/profile-view.js
import { LitElement, html } from 'lit';
import { profileViewStyles } from './profile-view.css.js';

// Импортируем секции
import './sections/profile-section.js';
import './sections/security-section.js';
import './sections/discovery-section.js';
import './sections/invitation-section.js';
import './sections/servers-section.js';

export class ProfileView extends LitElement {
	static properties = {
		profileActor: { type: Object },
		actorRegistry: { type: Object }, // 👈 Добавляем

		_state: { state: true },
		_profile: { state: true },
		_servers: { state: true },
		_activeServerId: { state: true },
		_identity: { state: true },
		_error: { state: true },
		_signalingActor: { state: true }, // 👈 Добавляем
	};

	static styles = profileViewStyles;

	constructor() {
		super();
		this._state = 'loading';
		this._profile = null;
		this._servers = [];
		this._activeServerId = null;
		this._identity = null;
		this._error = null;
		this._subscription = null;
		this._signalingActor = null; // 👈 Добавляем
	}

	connectedCallback() {
		super.connectedCallback();
		console.log(
			'[profile-view] connectedCallback, profileActor:',
			this.profileActor ? 'exists' : 'NULL'
		);
		this._subscribe();
		this._subscribeToSignaling();
		this._subscribeToSignalingReady();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._subscription?.unsubscribe();
		this._unsubRegistry?.(); // 👈 Также очищаем подписку на registry
		if (window.appContext?.eventBus) {
			window.appContext.eventBus.off('SIGNALING_READY', this._onSignalingReady);
		}
	}

	updated(changedProperties) {
		console.log(
			'[profile-view] updated called with properties:',
			Array.from(changedProperties.keys()),
			'profileActor:',
			this.profileActor ? 'exists' : 'NULL'
		);
		if (changedProperties.has('profileActor') && this.profileActor) {
			console.log('[profile-view] profileActor changed, re-subscribing');
			this._subscribe();
		}
		if (changedProperties.has('actorRegistry') && this.actorRegistry) {
			console.log(
				'[profile-view] actorRegistry changed, subscribing to signaling'
			);
			this._subscribeToSignaling();
		}
	}

	_subscribe() {
		console.log(
			'[profile-view] _subscribe called, profileActor:',
			this.profileActor ? 'exists' : 'NULL'
		);
		if (!this.profileActor) {
			console.warn('[profile-view] No profileActor provided');
			return;
		}

		this._subscription?.unsubscribe();

		const sync = (snapshot) => {
			// Определяем строковое состояние для UI
			if (snapshot.matches('ready')) {
				this._state = 'ready';
			} else if (snapshot.matches('loading')) {
				this._state = 'loading';
			} else if (snapshot.matches('savingProfile')) {
				this._state = 'savingProfile';
			} else if (snapshot.matches('processingAvatar')) {
				this._state = 'processingAvatar';
			} else if (snapshot.matches('savingServers')) {
				this._state = 'savingServers';
			} else if (snapshot.matches('changingPassword')) {
				this._state = 'changingPassword';
			} else {
				this._state = 'loading';
			}

			this._profile = snapshot.context.profile;
			this._servers = snapshot.context.signalingServers;
			this._activeServerId = snapshot.context.activeServerId;
			this._identity = snapshot.context.identity;
			this._error = snapshot.context.error;

			console.log(
				'[profile-view] State:',
				this._state,
				'Has profile:',
				!!this._profile,
				'Has servers:',
				this._servers?.length
			);

			this.requestUpdate();
		};

		const initialSnapshot = this.profileActor.getSnapshot();
		console.log('[profile-view] Initial snapshot:', {
			state: initialSnapshot.value,
			hasProfile: !!initialSnapshot.context.profile,
			hasServers: !!initialSnapshot.context.signalingServers?.length,
		});

		sync(initialSnapshot);
		this._subscription = this.profileActor.subscribe(sync);
	}

	// 👇 Добавляем метод для получения signaling actor

	_subscribeToSignaling() {
		console.log(
			'[profile] _subscribeToSignaling called, actorRegistry:',
			this.actorRegistry
		);
		if (!this.actorRegistry) {
			console.warn('[profile] No actorRegistry provided, cannot subscribe');
			return;
		}

		this._unsubRegistry?.();

		// ActorRegistry.subscribe() передает событие со структурой:
		// { type: 'sync', actors: Map }
		// { type: 'registered', id, entry, actors: Map }
		// { type: 'unregistered', id, reason, actors: Map }
		console.log('[profile] Subscribing to actorRegistry');
		this._unsubRegistry = this.actorRegistry.subscribe((event) => {
			console.log(
				'[profile] ActorRegistry event:',
				event.type,
				'actors:',
				event.actors?.size
			);
			// event.actors это Map, поэтому используем .get()
			const actorsMap = event.actors;
			if (!actorsMap) return;

			const signalingEntry = actorsMap.get('signaling');
			const signaling = signalingEntry?.actor || null;

			console.log(
				'[profile] Signaling from registry:',
				signaling ? 'found' : 'not found'
			);

			if (signaling && signaling !== this._signalingActor) {
				console.log(
					'[profile] Binding signaling actor from registry:',
					signaling
				);
				this._signalingActor = signaling;
				this.requestUpdate();
			}

			if (!signaling && this._signalingActor) {
				console.log('[profile] Signaling actor removed');
				this._signalingActor = null;
				this.requestUpdate();
			}
		});
	}

	_subscribeToSignalingReady() {
		// SIGNALING_READY событие отправляется в signaling/index.js:onMount()
		// Это гарантирует, что UI получит актор, даже если registry еще не синхронизировался
		const eventBus = window.appContext?.eventBus;
		if (!eventBus) {
			console.warn('[profile] No eventBus found in window.appContext');
			return;
		}

		console.log('[profile] Subscribing to SIGNALING_READY event');

		this._onSignalingReady = (event) => {
			console.log('[profile] SIGNALING_READY event received:', event);
			if (event.actor && event.actor !== this._signalingActor) {
				console.log(
					'[profile] Binding signaling actor from SIGNALING_READY event:',
					event.actor
				);
				this._signalingActor = event.actor;
				this.requestUpdate();
			}
		};

		eventBus.on('SIGNALING_READY', this._onSignalingReady);
	}

	get _service() {
		return this.profileActor?.getSnapshot().context.service;
	}

	render() {
		if (this._state === 'loading') {
			return html`<div class="loading">Загрузка настроек...</div>`;
		}

		return html`
			<div class="profile-container">
				${this._error
					? html`<div class="error-banner">⚠️ ${this._error}</div>`
					: ''}

				<profile-section
					.actor=${this.profileActor}
					.profile=${this._profile}
					.state=${this._state}
				></profile-section>

				<security-section
					.actor=${this.profileActor}
					.username=${this._profile?.username}
					.state=${this._state}
				></security-section>

				<discovery-section
					.actor=${this.profileActor}
					.enabled=${this._profile?.showInDiscovery || false}
				></discovery-section>

				<invitation-section
					.identity=${this._identity}
					.service=${this._service}
				></invitation-section>

				<servers-section
					.actor=${this.profileActor}
					.servers=${this._servers}
					.activeServerId=${this._activeServerId}
					.signalingActor=${this._signalingActor}
				></servers-section>
			</div>
		`;
	}
}

customElements.define('profile-view', ProfileView);
