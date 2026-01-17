// src/features/contacts/ui/components/accept-contact-dialog.js

import { LitElement, html, css } from 'lit';

export class AcceptContactDialog extends LitElement {
	static properties = {
		open: { type: Boolean, reflect: true },
		contact: { type: Object },
		groups: { type: Array },
		loading: { type: Boolean },
	};

	static styles = css`
		:host {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 1000;
			align-items: center;
			justify-content: center;
		}

		:host([open]) {
			display: flex;
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
		}

		.dialog {
			position: fixed;
			left: 50%;
			transform: translateX(-50%);
			top: 2rem;
			transform: translateX(-50%);
			background: var(--color-surface);
			border-radius: var(--radius-l);
			box-shadow: var(--shadow-lg);
			width: 90%;
			max-width: 450px;
			overflow: hidden;
		}

		.dialog-header {
			padding: var(--space-l);
			border-bottom: 1px solid var(--border-color);
		}

		.dialog-title {
			font-size: 1.25rem;
			font-weight: 600;
			margin: 0;
		}

		.dialog-body {
			padding: var(--space-l);
		}

		.contact-preview {
			display: flex;
			align-items: center;
			gap: var(--space-m);
			padding: var(--space-m);
			background: var(--color-surface-raised);
			border-radius: var(--radius-m);
			margin-bottom: var(--space-l);
		}

		.avatar {
			width: 64px;
			height: 64px;
			border-radius: 50%;
			background: var(--color-primary);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: 600;
			font-size: 1.5rem;
			flex-shrink: 0;
		}

		.avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 50%;
		}

		.contact-details {
			flex: 1;
			min-width: 0;
		}

		.contact-name {
			font-weight: 600;
			font-size: 1.125rem;
			margin-bottom: var(--space-1);
		}

		.contact-bio {
			font-size: 0.875rem;
			color: var(--color-text-muted);
			line-height: 1.4;
		}

		.form-group {
			margin-bottom: var(--space-m);
		}

		.form-label {
			display: block;
			font-weight: 500;
			font-size: 0.875rem;
			margin-bottom: var(--space-xs);
			color: var(--color-text-main);
		}

		.form-input {
			width: 100%;
			padding: var(--space-s);
			border: 1px solid var(--border-color);
			border-radius: var(--radius-m);
			font-size: 0.9375rem;
			font-family: inherit;
			background: var(--color-bg);
			color: var(--color-text-main);
			transition: border-color var(--transition-fast);
		}

		.form-input:focus {
			outline: none;
			border-color: var(--color-primary);
			box-shadow: 0 0 0 3px var(--color-primary-soft);
		}

		.dialog-footer {
			padding: var(--space-m) var(--space-l);
			border-top: 1px solid var(--border-color);
			display: flex;
			gap: var(--space-s);
			justify-content: flex-end;
		}

		.btn {
			padding: var(--space-xs) var(--space-m);
			border: none;
			border-radius: var(--radius-m);
			font-weight: 500;
			font-size: 0.9375rem;
			cursor: pointer;
			transition: all var(--transition-fast);
		}

		.btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.btn-secondary {
			background: var(--color-surface-raised);
			color: var(--color-text-main);
		}

		.btn-secondary:hover:not(:disabled) {
			background: var(--color-bg-hover);
		}

		.btn-primary {
			background: var(--color-success);
			color: var(--color-white);
		}

		.btn-primary:hover:not(:disabled) {
			background: var(--color-success-soft);
		}

		.spinner {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid rgba(255, 255, 255, 0.3);
			border-radius: 50%;
			border-top-color: white;
			animation: spin 0.6s linear infinite;
		}

		@keyframes spin {
			to {
				transform: rotate(360deg);
			}
		}
	`;

	constructor() {
		super();
		this.open = false;
		this.contact = null;
		this.groups = [];
		this.loading = false;
	}

	_getInitials(name) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	_handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			this._close();
		}
	}

	_close() {
		this.open = false;
		this.dispatchEvent(new CustomEvent('dialog-close'));
	}

	_handleSubmit(e) {
		e.preventDefault();

		const formData = new FormData(e.target);
		const group = formData.get('group').trim() || 'Default';

		this.dispatchEvent(
			new CustomEvent('accept-contact', {
				detail: {
					contactId: this.contact.id,
					group,
				},
				bubbles: true,
				composed: true,
			})
		);
	}

	render() {
		if (!this.contact) return html``;

		const { username, avatar, bio } = this.contact;

		return html`
			<div class="overlay" @click=${this._handleOverlayClick}>
				<div class="dialog">
					<div class="dialog-header">
						<h2 class="dialog-title">Добавление контакта</h2>
					</div>

					<form class="dialog-body" @submit=${this._handleSubmit}>
						<div class="contact-preview">
							<div class="avatar">
								${avatar
									? html`<img src=${avatar} alt=${username} />`
									: html`${this._getInitials(username)}`}
							</div>
							<div class="contact-details">
								<div class="contact-name">${username}</div>
								${bio ? html`<div class="contact-bio">${bio}</div>` : ''}
							</div>
						</div>

						<div class="form-group">
							<label class="form-label" for="group">
								Группа (необязательно)
							</label>
							<input
								list="groups"
								id="group"
								name="group"
								class="form-input"
								placeholder="Выберите или создайте группу"
								value="Default"
								?disabled=${this.loading}
							/>
							<datalist id="groups">
								${this.groups.map((g) => html`<option value=${g}></option>`)}
							</datalist>
						</div>

						<div class="dialog-footer">
							<button
								type="button"
								class="btn btn-secondary"
								@click=${this._close}
								?disabled=${this.loading}
							>
								Отмена
							</button>
							<button
								type="submit"
								class="btn btn-primary"
								?disabled=${this.loading}
							>
								${this.loading
									? html`<span class="spinner"></span>`
									: 'Добавить в контакты'}
							</button>
						</div>
					</form>
				</div>
			</div>
		`;
	}
}

customElements.define('accept-contact-dialog', AcceptContactDialog);
