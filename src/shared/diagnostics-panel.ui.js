// src/shared/diagnostics-panel.ui.js
import { LitElement, css } from 'lit';
import { html, unsafeStatic } from 'lit/static-html.js';

export class DiagnosticsPanel extends LitElement {
	static properties = {
		context: { type: Object },
		startupType: { type: String },
		featuresCount: { type: Number },
		diagnostics: { state: true },
	};

	constructor() {
		super();
		this.diagnostics = [];
	}

	static styles = css`
		:host {
			display: block;
			padding: var(--diagnostics-padding, var(--space-l));
			text-align: center;
			font-family: var(--font-ui);
		}

		h1 {
			font-family: var(--diagnostics-title-font, var(--font-accent));
			font-size: var(--diagnostics-title-size, var(--text-h2));
			color: var(--diagnostics-title-color, var(--color-text-main));
		}

		.info {
			color: var(--diagnostics-info-color, var(--color-text-muted));
			font-size: var(--diagnostics-info-size, var(--text-body));
		}

		.info p {
			margin: var(--space-xs, 0.5rem) 0;
			line-height: var(--line-normal, 1.45);
		}

		.diagnostics-container {
			display: flex;
			flex-direction: column;
			gap: var(--diagnostics-gap, var(--space-m));
			max-width: var(--diagnostics-max-width, 900px);
			margin: 0 auto;
		}

		/* Адаптив */
		@media (max-width: 768px) {
			:host {
				padding: var(--space-m, 1rem);
			}
		}
	`;

	updated(changed) {
		if (changed.has('context') && this.context) {
			this.diagnostics = this.context.featureRegistry
				.getAll()
				.filter((f) => f.ui?.diagnostics)
				.map((f) => f.ui.diagnostics);
		}
	}

	renderDiagnostics() {
		const container = this.shadowRoot.querySelector('.diagnostics-container');
		if (!container) return;

		container.innerHTML = '';

		const features = this.context.featureRegistry.getAll();

		features.forEach((feature) => {
			if (feature.ui?.diagnostics) {
				const element = document.createElement(feature.ui.diagnostics);
				element.context = this.context;
				container.appendChild(element);
			}
		});
	}
	render() {
		return html`
			<header class="header">
				<h1>✅ App Ready!</h1>

				<div class="info">
					<p>Startup: <strong>${this.startupType}</strong></p>
					<p>Features mounted: <strong>${this.featuresCount}</strong></p>
				</div>
			</header>
			<section class="diagnostics-container">
				${this.diagnostics.map((tag) => {
					const T = unsafeStatic(tag);
					return html`<${T} .context=${this.context}></${T}>`;
				})}
			</section>
		`;
	}
}

customElements.define('diagnostics-panel', DiagnosticsPanel);
