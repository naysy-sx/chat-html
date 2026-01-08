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
		`,
	];

	get _invitationKey() {
		if (!this.identity || !this.service) {
			return 'Загрузка...';
		}

		try {
			return this.service.generateInvitationKey(this.identity);
		} catch (err) {
			console.error('Failed to generate invitation key:', err);
			return 'Ошибка генерации ключа';
		}
	}

	render() {
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
