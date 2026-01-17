// src/features/shell/ui/screens/files-screen.js
import { LitElement, html, css } from 'lit';

export class FilesScreen extends LitElement {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			overflow-y: auto;
		}

		.files-container {
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
			<div class="files-container">
				<h2>📁 Файлы</h2>
				<div class="placeholder">
					<h3>Ваше хранилище файлов</h3>
					<p>
						Небольшие файлы будут храниться в IndexedDB и станут доступны для
						расшаривания с контактами
					</p>
				</div>
			</div>
		`;
	}
}

customElements.define('files-screen', FilesScreen);
