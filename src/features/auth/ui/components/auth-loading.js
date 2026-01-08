// src/features/auth/ui/components/auth-loading.js
import { LitElement, html, css } from 'lit';
import { layoutStyles } from '../../../../shared/ui/index.js';

export class AuthLoading extends LitElement {
	static properties = {
		message: { type: String },
	};

	static styles = [
		layoutStyles,
		css`
			:host {
				display: block;
			}

			.loading-container {
				text-align: center;
				padding: var(--space-xl);
				color: var(--color-text-muted);
			}

			.loading-container p {
				margin-top: var(--space-m);
			}
		`,
	];

	constructor() {
		super();
		this.message = 'Загрузка...';
	}

	render() {
		return html`
			<div class="loading-container">
				<div class="spinner"></div>
				<p>${this.message}</p>
			</div>
		`;
	}
}

customElements.define('auth-loading', AuthLoading);
