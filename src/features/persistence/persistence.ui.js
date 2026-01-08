// features/persistence/persistence.ui.js
import { LitElement, html, css } from 'lit';

export class PersistenceDiagnostics extends LitElement {
	static properties = {
		context: { type: Object },
	};

	static styles = css`
		:host {
			display: block;
			margin-top: var(--space-m, 1rem);
			padding: var(--space-m, 1rem);
			background: var(--color-surface);
			border: 1px solid var(--border-subtle);
			border-radius: var(--radius-l, 12px);
			font-family: var(--font-ui);
			transition: background 0.3s, border-color 0.3s;
		}

		.status {
			font-weight: 600;
			font-size: var(--text-body, 1rem);
			margin-bottom: var(--space-s, 0.75rem);
		}

		.ready {
			color: oklch(62% 0.19 142);
		}

		.error {
			color: oklch(58% 0.22 27);
		}

		pre {
			text-align: left;
			margin-top: var(--space-s, 0.75rem);
			font-size: var(--text-small, 0.85rem);
			font-family: ui-monospace, monospace;
			background: var(--surface-raised);
			padding: var(--space-s, 0.75rem);
			border-radius: var(--radius-m, 8px);
			overflow-x: auto;
			color: var(--color-text-main);
		}

		small {
			color: var(--color-text-muted);
			font-size: var(--text-small, 0.85rem);
		}
	`;

	constructor() {
		super();
		this.state = 'loading';
		this.result = null;
		this.error = null;
	}

	connectedCallback() {
		super.connectedCallback();
		this.runTest();
	}

	async runTest() {
		try {
			const { service: storage } =
				this.context.featureRegistry.getMountResult('persistence');

			await storage.set('test', { ok: true, timestamp: Date.now() });
			const result = await storage.get('test');
			await storage.delete('test');

			this.state = 'ready';
			this.result = result;
			this.requestUpdate();
		} catch (err) {
			this.state = 'error';
			this.error = err.message;
			this.requestUpdate();
		}
	}

	render() {
		if (this.state === 'loading') {
			return html` <div class="status">💾 Persistence test...</div> `;
		}

		if (this.state === 'error') {
			return html`
				<div class="status error">❌ Persistence test failed</div>
				<small>${this.error}</small>
			`;
		}

		return html`
			<div class="status ready">✅ Persistence OK</div>
			<pre>${JSON.stringify(this.result, null, 2)}</pre>
		`;
	}
}

customElements.define('persistence-diagnostics', PersistenceDiagnostics);
