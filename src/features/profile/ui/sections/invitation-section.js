// src/features/settings/ui/sections/invitation-section.js
import { LitElement, html, css } from 'lit';
import { sectionStyles, formStyles } from '../../../../shared/ui/index.js';

export class InvitationSection extends LitElement {
	static properties = {
		identity: { type: Object },
		service: { type: Object },
	};

	static styles = [
		sectionStyles,
		formStyles,
		css`
			.key-container {
				display: flex;
				gap: var(--space-s);
				align-items: center;
			}

			.key-code {
				flex: 1;
				padding: var(--space-s) var(--space-m);
				background: var(--color-surface-raised);
				border: 1px solid var(--color-border);
				border-radius: var(--radius-m);
				font-family: var(--font-mono);
				font-size: var(--text-sm);
				word-break: break-all;
				cursor: pointer;
				user-select: all;
				transition: background var(--transition-fast);
			}

			.key-code:hover {
				background: var(--color-bg-hover);
			}

			.debug-info {
				margin-top: var(--space-s);
				padding: var(--space-s);
				background: var(--color-warning-soft, #fff3cd);
				border-radius: var(--radius-s);
				font-size: var(--text-xs);
				font-family: var(--font-mono);
				color: var(--color-warning, #856404);
			}
		`,
	];

	get _invitationKey() {
		if (!this.identity || !this.service) {
			console.warn('[invitation-section] Missing identity or service:', {
				hasIdentity: !!this.identity,
				hasService: !!this.service,
			});
			return 'Загрузка...';
		}

		// ✅ ДИАГНОСТИКА: Логируем что именно используется
		console.log('[invitation-section] Generating key with identity:', {
			userId: this.identity.userId?.slice(0, 16) + '...',
			hasExchange: !!this.identity.exchange,
			fullIdentity: this.identity,
		});

		try {
			const key = this.service.generateInvitationKey(this.identity);

			// ✅ Проверяем что ключ содержит правильный userId
			try {
				const decoded = JSON.parse(atob(key));
				console.log(
					'[invitation-section] Generated key contains uid:',
					decoded.uid?.slice(0, 16) + '...'
				);
			} catch (e) {}

			return key;
		} catch (err) {
			console.error(
				'[invitation-section] Failed to generate invitation key:',
				err
			);
			return 'Ошибка генерации ключа';
		}
	}

	render() {
		// ✅ ДИАГНОСТИКА в render
		console.log(
			'[invitation-section] render, identity userId:',
			this.identity?.userId?.slice(0, 16) + '...'
		);

		return html`
			<div class="section">
				<h2 class="section-title">🔑 Ключ приглашения</h2>

				<div class="form-group">
					<label class="label"
						>Нажмите чтобы скопировать ключ в буфер обмена</label
					>
					<div class="key-container">
						<code class="key-code" @click=${this._handleCopy}>
							${this._invitationKey}
						</code>
					</div>
					<p class="help-text">
						Отправьте этот ключ другим пользователям чтобы они могли добавить
						вас в контакты
					</p>

					<!-- ✅ ВРЕМЕННАЯ ДИАГНОСТИКА -->
					<div class="debug-info">
						📍 Your userId: ${this.identity?.userId?.slice(0, 20) || 'N/A'}...
					</div>
				</div>
			</div>
		`;
	}

	_handleCopy() {
		const key = this._invitationKey;
		if (key && key !== 'Загрузка...' && key !== 'Ошибка генерации ключа') {
			navigator.clipboard.writeText(key).then(() => {
				alert(
					'Ваш ключ скопирован и находится в буфере обмена. Теперь вы можете отправить его другим пользователям'
				);
			});
		}
	}
}

customElements.define('invitation-section', InvitationSection);
