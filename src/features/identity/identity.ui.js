// features/identity/identity.ui.js
import { LitElement, html, css } from 'lit';

export class IdentityDiagnostics extends LitElement {
	static properties = {
		context: { type: Object },
	};

	static styles = css`
		:host {
			display: block;
			margin-top: var(--space-m, 1rem);
			padding: var(--space-m, 1rem);
			background: var(--color-surface, #f5f5f5);
			border: 1px solid var(--border-subtle, #e0e0e0);
			border-radius: var(--radius-l, 12px);
			font-family: var(--font-ui);
			transition: background 0.3s, border-color 0.3s;
		}

		.status {
			font-weight: 600;
			font-size: var(--text-body, 1rem);
			margin-bottom: var(--space-s, 0.75rem);
		}

		.loading {
			color: var(--color-text-muted, #666);
		}

		.ready {
			color: oklch(62% 0.19 142); /* зелёный */
		}

		.error {
			color: oklch(58% 0.22 27); /* красный */
		}

		.detail-section {
			margin-top: var(--space-m, 1rem);
			padding: var(--space-s, 0.75rem);
			background: var(--surface-raised, rgba(255, 255, 255, 0.5));
			border-radius: var(--radius-m, 8px);
			text-align: left;
		}

		.detail-section h4 {
			margin: 0 0 var(--space-xs, 0.5rem) 0;
			font-size: var(--text-small, 0.9rem);
			font-weight: 600;
			color: var(--color-text-muted, #666);
			display: flex;
			align-items: center;
			gap: var(--space-xs, 0.5rem);
		}

		.detail-content {
			font-family: ui-monospace, 'Cascadia Mono', monospace;
			font-size: var(--text-small, 0.85rem);
			line-height: var(--line-normal, 1.4);
			word-break: break-all;
			color: var(--color-text-main);
		}

		.step-icon {
			font-size: 1.2em;
		}

		.match-indicator {
			display: inline-block;
			padding: var(--space-xs, 0.4rem) var(--space-s, 0.75rem);
			border-radius: var(--radius-m, 6px);
			font-weight: 600;
			font-size: var(--text-small, 0.9rem);
		}

		.match-indicator.success {
			background: oklch(92% 0.08 142);
			color: oklch(32% 0.14 142);
		}

		.match-indicator.fail {
			background: oklch(92% 0.08 27);
			color: oklch(42% 0.14 27);
		}

		code {
			background: var(--color-surface, rgba(0, 0, 0, 0.05));
			padding: 0.2em 0.4em;
			border-radius: var(--radius-s, 4px);
			font-family: ui-monospace, monospace;
			font-size: 0.9em;
		}

		.crypto-details {
			display: grid;
			gap: var(--space-s, 0.75rem);
			margin-top: var(--space-s, 0.75rem);
		}

		.crypto-field {
			display: flex;
			flex-direction: column;
			gap: var(--space-xs, 0.25rem);
		}

		.crypto-field-label {
			font-weight: 600;
			font-size: var(--text-small, 0.85rem);
			color: var(--color-text-muted, #666);
		}

		.crypto-field-value {
			font-family: ui-monospace, monospace;
			font-size: var(--text-small, 0.8rem);
			padding: var(--space-xs, 0.5rem);
			background: var(--surface-raised, rgba(0, 0, 0, 0.03));
			border-radius: var(--radius-s, 4px);
			word-break: break-all;
			color: var(--color-text-main);
		}

		.info-line {
			font-size: var(--text-small, 0.85rem);
			color: var(--color-text-muted, #666);
			margin-top: var(--space-s, 0.75rem);
			line-height: var(--line-loose, 1.6);
		}

		/* Адаптив */
		@media (max-width: 640px) {
			:host {
				padding: var(--space-s, 0.75rem);
			}

			.crypto-field-value {
				font-size: 0.75rem;
			}
		}
	`;

	constructor() {
		super();
		this.state = 'loading';
		this.result = null;
		this.error = null;
	}

	connectedCallback() {
		super.connectedCallback();
		this.runTest();
	}

	async runTest() {
		try {
			const mountResult =
				this.context.featureRegistry.getMountResult('identity');

			if (!mountResult) {
				throw new Error('Identity feature not mounted');
			}

			const { actor: identityActor, crypto } = mountResult;

			// Ждём готовности
			await new Promise((resolve, reject) => {
				const sub = identityActor.subscribe((s) => {
					if (s.matches('ready')) {
						sub.unsubscribe();
						resolve();
					}
					if (s.matches('error')) {
						sub.unsubscribe();
						reject(new Error('Identity feature in error state'));
					}
				});

				if (identityActor.getSnapshot().matches('ready')) {
					sub.unsubscribe();
					resolve();
				}
			});

			const snap = identityActor.getSnapshot();
			const ctx = snap.context;

			// Тест шифрования
			const plaintext = 'Привет! Это тест шифрования 🔐';

			const encrypted = await crypto.encrypt(plaintext, ctx.exchange.publicKey);

			const decrypted = await crypto.decrypt(
				encrypted,
				ctx.exchange.privateKey
			);

			const ok = decrypted === plaintext;

			if (!ok) {
				throw new Error('Decrypt mismatch');
			}

			this.state = 'ready';
			this.result = {
				userId: ctx.userId,
				plaintext,
				encrypted,
				decrypted,
				match: ok,
			};

			this.requestUpdate();
		} catch (err) {
			this.state = 'error';
			this.error = err.message;
			this.requestUpdate();
		}
	}

	render() {
		if (this.state === 'loading') {
			return html`
				<div class="status loading">
					🔐 Identity & Crypto test...
					<em>ожидание готовности...</em>
				</div>
			`;
		}

		if (this.state === 'error') {
			return html`
				<div class="status error">❌ Identity test failed</div>
				<small>${this.error}</small>
			`;
		}

		return html`
			<div class="status ready">✅ Identity & Crypto OK</div>

			<div class="info-line">
				userId: <code>${this.result.userId.slice(0, 16)}…</code><br />
				Algorithm: ECDH P-256 → AES-256-GCM
			</div>

			<!-- Шаг 1: Исходный текст -->
			<div class="detail-section">
				<h4>
					<span class="step-icon">📝</span>
					Шаг 1: Исходный текст
				</h4>
				<div class="detail-content">${this.result.plaintext}</div>
			</div>

			<!-- Шаг 2: Зашифрованные данные -->
			<div class="detail-section">
				<h4>
					<span class="step-icon">🔒</span>
					Шаг 2: Зашифровано
				</h4>
				<div class="crypto-details">
					<div class="crypto-field">
						<div class="crypto-field-label">Ciphertext (base64):</div>
						<div class="crypto-field-value">
							${this.truncate(this.result.encrypted.ciphertext, 80)}
						</div>
					</div>

					<div class="crypto-field">
						<div class="crypto-field-label">IV (12 bytes):</div>
						<div class="crypto-field-value">${this.result.encrypted.iv}</div>
					</div>

					<div class="crypto-field">
						<div class="crypto-field-label">Ephemeral Public Key (JWK):</div>
						<div class="crypto-field-value">
							${this.truncate(
								JSON.stringify(this.result.encrypted.ephemeralPublicKey),
								100
							)}
						</div>
					</div>

					<div class="crypto-field">
						<div class="crypto-field-label">Algorithm:</div>
						<div class="crypto-field-value">
							${this.result.encrypted.algorithm}
						</div>
					</div>
				</div>
			</div>

			<!-- Шаг 3: Расшифрованный текст -->
			<div class="detail-section">
				<h4>
					<span class="step-icon">🔓</span>
					Шаг 3: Расшифровано
				</h4>
				<div class="detail-content">${this.result.decrypted}</div>
			</div>

			<!-- Проверка -->
			<div class="detail-section">
				<h4>
					<span class="step-icon">✓</span>
					Проверка целостности
				</h4>
				<div>
					<span
						class="match-indicator ${this.result.match ? 'success' : 'fail'}"
					>
						${this.result.match
							? '✅ Совпадает! Шифрование работает корректно'
							: '❌ Не совпадает! Ошибка шифрования'}
					</span>
				</div>
				<div
					style="margin-top: var(--space-s, 0.75rem); font-size: var(--text-small, 0.85rem); color: var(--color-text-muted);"
				>
					Plaintext: <code>${this.result.plaintext.length}</code> символов<br />
					Ciphertext:
					<code>${this.result.encrypted.ciphertext.length}</code> символов
					(base64)<br />
					Decrypted: <code>${this.result.decrypted.length}</code> символов
				</div>
			</div>
		`;
	}

	truncate(str, maxLength) {
		if (str.length <= maxLength) {
			return str;
		}
		return str.slice(0, maxLength) + '... [обрезано]';
	}
}

customElements.define('identity-diagnostics', IdentityDiagnostics);
