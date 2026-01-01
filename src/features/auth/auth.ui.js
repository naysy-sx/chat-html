// Auth UI Components
import { LitElement, html, css } from "lit";

export class LoginForm extends LitElement {
	static properties = {
		error: { type: String },
		loading: { type: Boolean },
	};

	static styles = css`
		:host {
			display: block;
			max-width: 400px;
			margin: 2rem auto;
			padding: 2rem;
			border: 1px solid #ddd;
			border-radius: 8px;
		}

		h2 {
			margin-top: 0;
		}

		.form-group {
			margin-bottom: 1rem;
		}

		label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: bold;
		}

		input {
			width: 100%;
			padding: 0.5rem;
			border: 1px solid #ddd;
			border-radius: 4px;
			box-sizing: border-box;
		}

		button {
			width: 100%;
			padding: 0.75rem;
			background: #007bff;
			color: white;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 1rem;
		}

		button:hover {
			background: #0056b3;
		}

		button:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		.error {
			color: red;
			margin-top: 0.5rem;
		}

		.switch {
			margin-top: 1rem;
			text-align: center;
		}

		.switch a {
			color: #007bff;
			cursor: pointer;
			text-decoration: underline;
		}
	`;

	constructor() {
		super();
		this.error = "";
		this.loading = false;
	}

	connectedCallback() {
		super.connectedCallback();

		// Подписываемся на ошибки из auth актора
		if (typeof window !== "undefined" && window.appContext) {
			const authActor = window.appContext.actorRegistry.get("auth");
			if (authActor) {
				authActor.subscribe((snapshot) => {
					if (snapshot.context?.error) {
						this.error = snapshot.context.error;
						this.loading = false;
					} else if (snapshot.matches("authenticated")) {
						this.loading = false;
						this.error = "";
					} else if (
						snapshot.matches("loggingIn") ||
						snapshot.matches("signingUp")
					) {
						this.loading = true;
						this.error = "";
					}
					this.requestUpdate();
				});
			}
		}
	}

	handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const username = formData.get("username");
		const password = formData.get("password");

		if (!username || !password) {
			this.error = "Please fill in all fields";
			return;
		}

		this.loading = true;
		this.error = "";

		// Отправляем событие через EventBus
		const event = new CustomEvent("auth-login", {
			detail: { username, password },
			bubbles: true,
			composed: true,
		});
		this.dispatchEvent(event);
	}

	handleSwitchToSignup() {
		this.dispatchEvent(
			new CustomEvent("auth-switch-to-signup", {
				bubbles: true,
				composed: true,
			})
		);
	}

	render() {
		return html`
			<h2>Login</h2>
			<form @submit=${this.handleSubmit}>
				<div class="form-group">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						?disabled=${this.loading}
					/>
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						?disabled=${this.loading}
					/>
				</div>
				${this.error ? html`<div class="error">${this.error}</div>` : ""}
				<button type="submit" ?disabled=${this.loading}>
					${this.loading ? "Logging in..." : "Login"}
				</button>
				<div class="switch">
					Don't have an account?
					<a @click=${this.handleSwitchToSignup}>Sign up</a>
				</div>
			</form>
		`;
	}
}

export class SignupForm extends LitElement {
	static properties = {
		error: { type: String },
		loading: { type: Boolean },
	};

	static styles = css`
		:host {
			display: block;
			max-width: 400px;
			margin: 2rem auto;
			padding: 2rem;
			border: 1px solid #ddd;
			border-radius: 8px;
		}

		h2 {
			margin-top: 0;
		}

		.form-group {
			margin-bottom: 1rem;
		}

		label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: bold;
		}

		input {
			width: 100%;
			padding: 0.5rem;
			border: 1px solid #ddd;
			border-radius: 4px;
			box-sizing: border-box;
		}

		button {
			width: 100%;
			padding: 0.75rem;
			background: #28a745;
			color: white;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 1rem;
		}

		button:hover {
			background: #218838;
		}

		button:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		.error {
			color: red;
			margin-top: 0.5rem;
		}

		.switch {
			margin-top: 1rem;
			text-align: center;
		}

		.switch a {
			color: #007bff;
			cursor: pointer;
			text-decoration: underline;
		}
	`;

	constructor() {
		super();
		this.error = "";
		this.loading = false;
	}

	connectedCallback() {
		super.connectedCallback();

		// Подписываемся на ошибки из auth актора
		if (typeof window !== "undefined" && window.appContext) {
			const authActor = window.appContext.actorRegistry.get("auth");
			if (authActor) {
				authActor.subscribe((snapshot) => {
					if (snapshot.context?.error) {
						this.error = snapshot.context.error;
						this.loading = false;
					} else if (snapshot.matches("authenticated")) {
						this.loading = false;
						this.error = "";
					} else if (
						snapshot.matches("loggingIn") ||
						snapshot.matches("signingUp")
					) {
						this.loading = true;
						this.error = "";
					}
					this.requestUpdate();
				});
			}
		}
	}

	handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const username = formData.get("username");
		const password = formData.get("password");

		if (!username || !password) {
			this.error = "Please fill in all fields";
			return;
		}

		this.loading = true;
		this.error = "";

		// Отправляем событие через EventBus
		const event = new CustomEvent("auth-signup", {
			detail: { username, password },
			bubbles: true,
			composed: true,
		});
		this.dispatchEvent(event);
	}

	handleSwitchToLogin() {
		this.dispatchEvent(
			new CustomEvent("auth-switch-to-login", {
				bubbles: true,
				composed: true,
			})
		);
	}

	render() {
		return html`
			<h2>Sign Up</h2>
			<form @submit=${this.handleSubmit}>
				<div class="form-group">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						name="username"
						required
						?disabled=${this.loading}
					/>
				</div>
				<div class="form-group">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						?disabled=${this.loading}
					/>
				</div>
				${this.error ? html`<div class="error">${this.error}</div>` : ""}
				<button type="submit" ?disabled=${this.loading}>
					${this.loading ? "Signing up..." : "Sign Up"}
				</button>
				<div class="switch">
					Already have an account?
					<a @click=${this.handleSwitchToLogin}>Login</a>
				</div>
			</form>
		`;
	}
}

customElements.define("login-form", LoginForm);
customElements.define("signup-form", SignupForm);
