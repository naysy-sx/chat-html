// src/features/shell/ui/screens/discovery-screen.js
import { LitElement, html, css } from 'lit';

export class DiscoveryScreen extends LitElement {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			overflow-y: auto;
		}

		.discovery-container {
			max-width: 800px;
			margin: 0 auto;
			padding: var(--space-l);
		}

		.placeholder {
			padding: var(--space-2xl);
			text-align: center;
			color: var(--color-text-muted);
		}

		h2 {
			font-size: var(--text-2xl);
			font-weight: 600;
			color: var(--color-text-main);
			margin: 0 0 var(--space-l);
		}

		h3 {
			margin: 0 0 var(--space-s);
			color: var(--color-text-main);
		}
	`;

	render() {
		return html`
			<div class="discovery-container">
				<h2>🌐 Обзор</h2>
				<div class="placeholder">
					<h3>Откройте мир новых знакомств</h3>
					<p>
						Здесь будут отображаться пользователи, готовые к общению прямо
						сейчас, и публичные заметки из журналов других людей
					</p>
				</div>
			</div>
		`;
	}
}

customElements.define('discovery-screen', DiscoveryScreen);
