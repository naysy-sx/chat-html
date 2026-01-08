// src/features/shell/ui/components/loading-screen.js
import { LitElement, html, css } from 'lit';
import { layoutStyles } from '../../../../shared/ui/index.js';

export class LoadingScreen extends LitElement {
	static properties = {
		message: { type: String },
	};

	static styles = [
		layoutStyles,
		css`
			:host {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100dvh;
				background: var(--color-bg);
			}

			.container {
				text-align: center;
			}

			.message {
				margin-top: var(--space-m);
				color: var(--color-text-muted);
			}
		`,
	];

	constructor() {
		super();
		this.message = 'Загрузка...';
	}

	render() {
		return html`
			<div class="container">
				<div class="spinner"></div>
				<p class="message">${this.message}</p>
			</div>
		`;
	}
}

customElements.define('loading-screen', LoadingScreen);
