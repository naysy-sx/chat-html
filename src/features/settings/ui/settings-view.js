// src/features/settings/ui/settings-view.js
import { LitElement, html } from 'lit';
import { settingsViewStyles } from './settings-view.css.js';

// Импортируем секции
import './sections/profile-section.js';
import './sections/security-section.js';
import './sections/discovery-section.js';
import './sections/invitation-section.js';
import './sections/servers-section.js';

export class SettingsView extends LitElement {
	static properties = {
		settingsActor: { type: Object },
		actorRegistry: { type: Object }, // 👈 Добавляем

		_state: { state: true },
		_profile: { state: true },
		_servers: { state: true },
		_activeServerId: { state: true },
		_identity: { state: true },
		_error: { state: true },
		_signalingActor: { state: true }, // 👈 Добавляем
	};

	static styles = settingsViewStyles;

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
		this._subscribe();
		this._subscribeToSignaling(); // 👈 Слушаем eventBus на SIGNALING_READY
		this._subscribeToSignalingReady(); // 👈 Дополнительная подписка на событие
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
			'[settings] updated called with properties:',
			Array.from(changedProperties.keys())
		);
		if (changedProperties.has('settingsActor') && this.settingsActor) {
			this._subscribe();
		}
		// 👇 Добавляем
		if (changedProperties.has('actorRegistry') && this.actorRegistry) {
			console.log('[settings] actorRegistry changed, subscribing to signaling');
			this._subscribeToSignaling();
		}
	}

	_subscribe() {
		if (!this.settingsActor) return;

		this._subscription?.unsubscribe();

		const sync = (snapshot) => {
			this._state = snapshot.value;
			this._profile = snapshot.context.profile;
			this._servers = snapshot.context.signalingServers;
			this._activeServerId = snapshot.context.activeServerId;
			this._identity = snapshot.context.identity;
			this._error = snapshot.context.error;
		};

		sync(this.settingsActor.getSnapshot());
		this._subscription = this.settingsActor.subscribe(sync);
	}

	// 👇 Добавляем метод для получения signaling actor

	_subscribeToSignaling() {
		console.log(
			'[settings] _subscribeToSignaling called, actorRegistry:',
			this.actorRegistry
		);
		if (!this.actorRegistry) {
			console.warn('[settings] No actorRegistry provided, cannot subscribe');
			return;
		}

		this._unsubRegistry?.();

		// ActorRegistry.subscribe() передает событие со структурой:
		// { type: 'sync', actors: Map }
		// { type: 'registered', id, entry, actors: Map }
		// { type: 'unregistered', id, reason, actors: Map }
		console.log('[settings] Subscribing to actorRegistry');
		this._unsubRegistry = this.actorRegistry.subscribe((event) => {
			console.log(
				'[settings] ActorRegistry event:',
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
				'[settings] Signaling from registry:',
				signaling ? 'found' : 'not found'
			);

			if (signaling && signaling !== this._signalingActor) {
				console.log(
					'[settings] Binding signaling actor from registry:',
					signaling
				);
				this._signalingActor = signaling;
				this.requestUpdate();
			}

			if (!signaling && this._signalingActor) {
				console.log('[settings] Signaling actor removed');
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
			console.warn('[settings] No eventBus found in window.appContext');
			return;
		}

		console.log('[settings] Subscribing to SIGNALING_READY event');

		this._onSignalingReady = (event) => {
			console.log('[settings] SIGNALING_READY event received:', event);
			if (event.actor && event.actor !== this._signalingActor) {
				console.log(
					'[settings] Binding signaling actor from SIGNALING_READY event:',
					event.actor
				);
				this._signalingActor = event.actor;
				this.requestUpdate();
			}
		};

		eventBus.on('SIGNALING_READY', this._onSignalingReady);
	}

	get _service() {
		return this.settingsActor?.getSnapshot().context.service;
	}

	render() {
		if (this._state === 'loading') {
			return html`<div class="loading">Загрузка настроек...</div>`;
		}

		return html`
			<div class="settings-container">
				${this._error
					? html`<div class="error-banner">⚠️ ${this._error}</div>`
					: ''}

				<profile-section
					.actor=${this.settingsActor}
					.profile=${this._profile}
					.state=${this._state}
				></profile-section>

				<security-section
					.actor=${this.settingsActor}
					.username=${this._profile?.username}
					.state=${this._state}
				></security-section>

				<discovery-section
					.actor=${this.settingsActor}
					.enabled=${this._profile?.showInDiscovery || false}
				></discovery-section>

				<invitation-section
					.identity=${this._identity}
					.service=${this._service}
				></invitation-section>

				<servers-section
					.actor=${this.settingsActor}
					.servers=${this._servers}
					.activeServerId=${this._activeServerId}
					.signalingActor=${this._signalingActor}
				></servers-section>
			</div>
		`;
	}
}

customElements.define('settings-view', SettingsView);
