// src/features/settings/ui/sections/servers-section.js
import { LitElement, html, css } from 'lit';
import {
	sectionStyles,
	formStyles,
	buttonStyles,
} from '../../../../shared/ui/index.js';

export class ServersSection extends LitElement {
	static properties = {
		actor: { type: Object },
		servers: { type: Array },
		activeServerId: { type: String },
		signalingActor: { type: Object }, // 👈 Новое

		// Внутреннее состояние signaling
		_signalingState: { state: true },
		_signalingError: { state: true },
		_signalingRetryCount: { state: true },
	};

	static styles = [
		sectionStyles,
		formStyles,
		buttonStyles,
		css`
			.current-server {
				display: flex;
				gap: var(--space-s);
				align-items: center;
			}

			.server-url {
				flex: 1;
				padding: var(--space-s);
				background: var(--color-bg);
				border-radius: var(--radius-m);
				font-family: var(--font-mono);
				font-size: var(--text-sm);
			}

			.current-server {
				display: flex;
				align-items: center;
				gap: var(--space-s);
			}

			/* Статус сервера */

			.server-url {
				padding: 2px 6px;
				background: var(--color-bg);
				border-radius: var(--radius-s);
				font-family: var(--font-mono);
				font-size: var(--text-sm);
			}

			.server-status {
				padding: var(--space-m);
				border: 2px solid;
				border-radius: var(--radius-m);
				margin-top: var(--space-m);
			}

			.server-main-line {
				margin-bottom: var(--space-m);
			}

			.server-status-text {
				display: flex;
				align-items: center;
				gap: 6px;
				font-weight: 500;
				margin-bottom: var(--space-s);
			}

			.server-controls {
				display: grid;
				grid-template-columns: 1fr auto;
				gap: var(--space-s);
				align-items: center;
			}

			.server-help {
				font-size: var(--text-xs);
				color: var(--color-text-muted);
			}

			.server-status.status-connected {
				border-color: var(--color-success);
				background: var(--color-success-soft);
			}

			.server-status.status-connecting {
				border-color: var(--color-warning);
				background: var(--color-warning-soft);
			}

			.server-status.status-error {
				border-color: var(--color-danger);
				background: var(--color-danger-soft);
			}

			.server-status.status-idle {
				border-color: var(--color-border);
			}

			.status-header {
				display: flex;
				align-items: center;
				gap: var(--space-s);
				margin-bottom: var(--space-s);
			}

			.status-indicator {
				width: var(--indicator-size-md);
				height: var(--indicator-size-md);
				border-radius: 50%;
				animation: pulse 2s ease-in-out infinite;
			}

			.status-indicator.connected {
				background: var(--color-success);
			}

			.status-indicator.connecting {
				background: var(--color-warning);
			}

			.status-indicator.error {
				background: var(--color-danger);
			}

			.status-indicator.idle {
				background: var(--color-text-muted);
				animation: none;
			}

			.status-indicator.reconnecting {
				background: var(--color-warning);
				animation: pulse 1s ease-in-out infinite;
			}

			@keyframes pulse {
				0%,
				100% {
					opacity: 1;
				}
				50% {
					opacity: 0.5;
				}
			}

			.status-title {
				font-weight: 600;
				font-size: var(--text-body);
			}

			.status-details {
				font-size: var(--text-sm);
				color: var(--color-text-muted);
				margin-top: var(--space-xs);
			}

			.status-error {
				margin-top: var(--space-s);
				padding: var(--space-s);
				background: var(--color-danger-soft);
				border-radius: var(--radius-s);
				font-size: var(--text-sm);
				color: var(--color-danger-text);
			}

			.retry-info {
				margin-top: var(--space-xs);
				font-size: var(--text-xs);
				color: var(--color-text-muted);
			}
		`,
	];

	constructor() {
		super();
		this._signalingState = 'idle';
		this._signalingError = null;
		this._signalingRetryCount = 0;
		this._signalingSubscription = null;
	}

	connectedCallback() {
		super.connectedCallback();
		// Если актор уже есть - подписываемся сразу
		if (this.signalingActor) {
			this._subscribeToSignaling();
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._signalingSubscription?.unsubscribe();
	}

	updated(changedProperties) {
		// Когда actorRegistry обновляется - перепроверяем subscriptions
		if (changedProperties.has('signalingActor') && this.signalingActor) {
			this._subscribeToSignaling();
		}
	}

	updated(changedProperties) {
		if (changedProperties.has('signalingActor')) {
			this._subscribeToSignaling();
		}
	}

	_subscribeToSignaling() {
		// Отписываемся от старой подписки
		this._signalingSubscription?.unsubscribe();

		if (!this.signalingActor) {
			this._signalingState = 'idle';
			return;
		}

		const sync = (snapshot) => {
			// Определяем состояние (может быть вложенным)
			let state = 'idle';
			if (snapshot.matches('idle')) state = 'idle';
			else if (snapshot.matches('connecting')) state = 'connecting';
			else if (snapshot.matches('connected')) state = 'connected';
			else if (snapshot.matches('reconnecting')) state = 'reconnecting';
			else if (snapshot.matches('error')) state = 'error';

			this._signalingState = state;
			this._signalingError = snapshot.context.error;
			this._signalingRetryCount = snapshot.context.retryCount;
		};

		// Синхронизируем начальное состояние
		const initialSnapshot = this.signalingActor.getSnapshot();
		sync(initialSnapshot);

		console.log(
			'[servers-section] Subscribed to signaling, state:',
			this._signalingState,
			'snapshot:',
			initialSnapshot.value
		);

		// Подписываемся на изменения
		this._signalingSubscription = this.signalingActor.subscribe(sync);
	}

	get _activeServer() {
		return this.servers?.find((s) => s.id === this.activeServerId);
	}

	_getStatusConfig() {
		const configs = {
			idle: {
				icon: '⚪',
				title: 'Не подключен',
				description: 'Ожидание подключения к серверу',
				cssClass: 'status-idle',
				indicatorClass: 'idle',
			},
			connecting: {
				icon: '🟡',
				title: 'Подключение...',
				description: 'Устанавливается соединение с сигнальным сервером',
				cssClass: 'status-connecting',
				indicatorClass: 'connecting',
			},
			connected: {
				icon: '🟢',
				title: 'Подключен',
				description: 'Сервер готов принимать и отправлять приглашения',
				cssClass: 'status-connected',
				indicatorClass: 'connected',
			},
			reconnecting: {
				icon: '🟠',
				title: 'Переподключение...',
				description: `Попытка восстановить соединение (попытка ${this._signalingRetryCount}/5)`,
				cssClass: 'status-connecting',
				indicatorClass: 'reconnecting',
			},
			error: {
				icon: '🔴',
				title: 'Ошибка подключения',
				description: 'Не удалось подключиться к серверу',
				cssClass: 'status-error',
				indicatorClass: 'error',
			},
		};

		return configs[this._signalingState] || configs.idle;
	}
	render() {
		const activeServer = this._activeServer;
		const statusConfig = this._getStatusConfig();

		return html`
			<div class="section">
				<h2 class="section-title">📡 Сигнальные серверы</h2>

				<div class="server-status ${statusConfig.cssClass}">
					<!-- Верхняя строка -->
					<div class="server-main-line">
						<strong>Текущий сервер:</strong>

						${activeServer
							? html`<code class="server-url">${activeServer.url}</code>`
							: html`<span>—</span>`}
						${activeServer && !activeServer.isDefault
							? html`
									<button
										class="btn btn--danger btn--xs"
										@click=${() => this._handleRemove(activeServer.id)}
									>
										Удалить
									</button>
							  `
							: ''}
					</div>

					<!-- Управление -->
					<div class="server-controls">
						<select
							class="select"
							.value=${this.activeServerId || ''}
							@change=${this._handleSelect}
						>
							${this.servers?.map(
								(server) => html`
									<option value=${server.id}>
										${server.label} ${server.isDefault ? '(по умолчанию)' : ''}
									</option>
								`
							)}
						</select>

						<button class="btn btn--secondary" @click=${this._handleAdd}>
							➕ Добавить
						</button>
					</div>

					<!-- Детали / ошибки -->
					<div class="status-details">
						<span class="server-status-text">
							<div
								class="status-indicator ${statusConfig.indicatorClass}"
							></div>
							${statusConfig.title} ${statusConfig.icon}
						</span>
						${statusConfig.description}
					</div>

					${this._signalingError
						? html`
								<div class="status-error">
									<strong>Ошибка:</strong>
									${this._signalingError}
								</div>
						  `
						: ''}
					${this._signalingState === 'reconnecting'
						? html`
								<div class="retry-info">
									Следующая попытка через
									${Math.pow(2, this._signalingRetryCount)} секунд
								</div>
						  `
						: ''}

					<!-- Примечание -->
					<div class="server-help">
						Вы можете добавить собственные сигнальные серверы для установки
						соединений
					</div>
				</div>
			</div>
		`;
	}

	_handleSelect(e) {
		this.actor?.send({
			type: 'SET_ACTIVE_SERVER',
			serverId: e.target.value,
		});
	}

	_handleAdd() {
		const url = prompt('Введите URL сигнального сервера (wss://...):');
		if (url) {
			this.actor?.send({ type: 'ADD_SERVER', url });
		}
	}

	_handleRemove(serverId) {
		if (confirm('Удалить этот сервер?')) {
			this.actor?.send({ type: 'REMOVE_SERVER', serverId });
		}
	}
}

customElements.define('servers-section', ServersSection);
