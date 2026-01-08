// src/features/shell/ui/screens/contacts-screen.js
import { LitElement, html, css } from 'lit';

export class ContactsScreen extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.placeholder {
			padding: var(--space-2xl);
			text-align: center;
			color: var(--color-text-muted);
		}

		h3 {
			margin: 0 0 var(--space-s);
			color: var(--color-text-main);
		}
	`;

	render() {
		return html`
			<div class="placeholder">
				<h3>📇 Список контактов</h3>
				<p>Здесь будут отображаться ваши контакты</p>
			</div>
		`;
	}
}

customElements.define('contacts-screen', ContactsScreen);
