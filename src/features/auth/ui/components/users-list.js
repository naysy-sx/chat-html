// src/features/auth/ui/components/users-list.js
import { LitElement, html, css } from 'lit';

export class UsersList extends LitElement {
	static properties = {
		users: { type: Array },
	};

	static styles = css`
		:host {
			display: block;
		}

		.users-list {
			margin-top: var(--space-l);
			padding-top: var(--space-l);
			border-top: 1px solid var(--color-border);
		}

		h3 {
			margin: 0 0 var(--space-s) 0;
			font-size: var(--text-sm);
			color: var(--color-text-muted);
			font-weight: 500;
		}

		.chips {
			display: flex;
			flex-wrap: wrap;
			gap: var(--space-2xs);
		}

		.user-chip {
			display: inline-block;
			padding: var(--space-xs) var(--space-s);
			background: var(--color-surface-raised);
			border-radius: var(--radius-s);
			font-size: var(--text-sm);
			cursor: pointer;
			transition: background var(--transition-fast);
			border: none;
			font-family: inherit;
			color: var(--color-text-main);
		}

		.user-chip:hover {
			background: var(--color-bg-hover);
		}
	`;

	constructor() {
		super();
		this.users = [];
	}

	render() {
		if (!this.users || this.users.length === 0) {
			return null;
		}

		return html`
			<div class="users-list">
				<h3>Существующие пользователи:</h3>
				<div class="chips">
					${this.users.map(
						(user) => html`
							<button
								class="user-chip"
								@click=${() => this._selectUser(user.username)}
							>
								${user.username}
							</button>
						`
					)}
				</div>
			</div>
		`;
	}

	_selectUser(username) {
		this.dispatchEvent(
			new CustomEvent('user-select', {
				detail: { username },
				bubbles: true,
				composed: true,
			})
		);
	}
}

customElements.define('users-list', UsersList);
