// src/features/shell/ui/components/auth-wrapper.js
import { LitElement, html, css } from 'lit';

export class AuthWrapper extends LitElement {
	static properties = {
		authActor: { type: Object },
	};

	static styles = css`
		:host {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100dvh;
			background: var(--gradient-auth);
		}
	`;

	render() {
		// Ленивый импорт auth-screen
		import('../../../auth/auth.ui.js');

		return html` <auth-screen .actor=${this.authActor}></auth-screen> `;
	}
}

customElements.define('auth-wrapper', AuthWrapper);
