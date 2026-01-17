// src/features/shell/ui/screens/profile-screen.js
import { LitElement, html, css } from 'lit';

export class ProfileScreen extends LitElement {
	static properties = {
		profileActor: { type: Object },
		actorRegistry: { type: Object },
	};

	static styles = css`
		:host {
			display: block;
			height: 100%;
			overflow-y: auto;
		}
	`;

	render() {
		// Ленивый импорт profile-view
		import('../../../profile/ui/profile-view.js');

		if (!this.profileActor) {
			return html`
				<div
					style="padding: var(--space-xl); text-align: center; color: var(--color-text-muted);"
				>
					Загрузка профиля...
				</div>
			`;
		}

		return html`
			<profile-view
				.profileActor=${this.profileActor}
				.actorRegistry=${this.actorRegistry}
			></profile-view>
		`;
	}
}

customElements.define('profile-screen', ProfileScreen);
