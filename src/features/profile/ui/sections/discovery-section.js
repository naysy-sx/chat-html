// src/features/settings/ui/sections/discovery-section.js
import { LitElement, html, css } from 'lit';
import { sectionStyles, formStyles } from '../../../../shared/ui/index.js';

export class DiscoverySection extends LitElement {
	static properties = {
		actor: { type: Object },
		enabled: { type: Boolean },
	};

	static styles = [
		sectionStyles,
		formStyles,
		css`
			.section--highlighted {
				border: 2px dashed var(--color-primary);
				background: var(--color-primary-soft);
			}

			.section--highlighted .section-title {
				color: var(--color-primary);
			}

			.badge {
				display: inline-block;
				padding: var(--space-3xs) var(--space-xs);
				background: var(--color-primary);
				color: var(--color-white);
				border-radius: var(--radius-xs);
				font-size: var(--text-xs);
				font-weight: 600;
				margin-left: var(--space-xs);
				vertical-align: middle;
			}

			.status-text {
				margin-top: var(--space-m);
			}

			.status-text--active {
				color: var(--color-primary);
			}
		`,
	];

	render() {
		const sectionClass = this.enabled
			? 'section section--highlighted'
			: 'section';

		return html`
			<div class=${sectionClass}>
				<h2 class="section-title">
					🌐 Обзор
					${this.enabled ? html`<span class="badge">Активно</span>` : ''}
				</h2>

				<div class="checkbox-group" @click=${this._handleToggle}>
					<input
						type="checkbox"
						class="checkbox-input"
						.checked=${this.enabled}
						@click=${(e) => e.stopPropagation()}
						@change=${this._handleToggle}
					/>
					<div class="checkbox-content">
						<div class="checkbox-label">
							Показывать мой профиль на странице «Обзор»
						</div>
						<div class="checkbox-description">
							Ваш аватар, имя и био будут видны всем пользователям чата в
							разделе «Обзор». Другие пользователи смогут отправить вам запрос
							на добавление в контакты.
						</div>
					</div>
				</div>

				<p
					class="help-text status-text ${this.enabled
						? 'status-text--active'
						: ''}"
				>
					${this.enabled
						? '✨ Ваш профиль виден в разделе «Обзор» для всех пользователей'
						: 'Включите эту опцию, чтобы другие пользователи могли найти вас'}
				</p>
			</div>
		`;
	}

	_handleToggle(e) {
		if (e.target.type === 'checkbox') {
			e.stopPropagation();
		}

		const newValue = !this.enabled;

		this.actor?.send({
			type: 'UPDATE_PROFILE',
			updates: { showInDiscovery: newValue },
		});

		// Автосохранение
		setTimeout(() => {
			this.actor?.send({ type: 'SAVE_PROFILE' });
		}, 50);
	}
}

customElements.define('discovery-section', DiscoverySection);
