// src/features/shell/ui/screens/journal-screen.js
import { LitElement, html, css } from 'lit';

export class JournalScreen extends LitElement {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			overflow-y: auto;
		}

		.journal-container {
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
			<div class="journal-container">
				<h2>📝 Журнал</h2>
				<div class="placeholder">
					<h3>Ваши заметки появятся здесь</h3>
					<p>
						Создавайте записи, которые можно оставить приватными или
						опубликовать
					</p>
				</div>
			</div>
		`;
	}
}

customElements.define('journal-screen', JournalScreen);
