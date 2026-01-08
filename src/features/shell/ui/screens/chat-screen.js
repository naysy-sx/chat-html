// src/features/shell/ui/screens/chat-screen.js
import { LitElement, html, css } from 'lit';

export class ChatScreen extends LitElement {
	static properties = {
		contactId: { type: String },
	};

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

		.contact-id {
			font-family: var(--font-mono);
			font-size: var(--text-sm);
			background: var(--color-surface-raised);
			padding: var(--space-xs) var(--space-s);
			border-radius: var(--radius-m);
		}
	`;

	render() {
		return html`
			<div class="placeholder">
				<h3>💬 Чат с контактом</h3>
				<p>
					Contact ID:
					<span class="contact-id">${this.contactId || 'не выбран'}</span>
				</p>
			</div>
		`;
	}
}

customElements.define('chat-screen', ChatScreen);
