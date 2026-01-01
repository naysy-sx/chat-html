// Shell UI
import { LitElement, html, css } from "lit";

export class AppShell extends LitElement {
	static properties = {
		authState: { type: String },
		showSignup: { type: Boolean },
		error: { type: String },
	};

	static styles = css`
		:host {
			display: block;
			min-height: 100vh;
			background: #f5f5f5;
		}

		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 2rem;
		}

		.header {
			background: white;
			padding: 1rem 2rem;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			margin-bottom: 2rem;
		}

		.header h1 {
			margin: 0;
			color: #333;
		}

		.content {
			background: white;
			padding: 2rem;
			border-radius: 8px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}

		.authenticated {
			text-align: center;
			padding: 2rem;
		}

		.authenticated h2 {
			color: #28a745;
		}

		button {
			padding: 0.5rem 1rem;
			background: #dc3545;
			color: white;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			margin-top: 1rem;
		}

		button:hover {
			background: #c82333;
		}
	`;

	constructor() {
		super();
		this.authState = "checking";
		this.showSignup = false;
		this.error = "";
	}

	connectedCallback() {
		super.connectedCallback();

		// Подписываемся на события auth
		// Ждём, пока appContext будет доступен
		const setupAuth = () => {
			if (typeof window !== "undefined" && window.appContext) {
				const authActor = window.appContext.actorRegistry.get("auth");

				if (authActor) {
					// Получаем текущее состояние
					const snapshot = authActor.getSnapshot();
					this.authState = snapshot.value;
					if (snapshot.context?.error) {
						this.error = snapshot.context.error;
					}

					// Подписываемся на изменения
					authActor.subscribe((snapshot) => {
						this.authState = snapshot.value;
						if (snapshot.context?.error) {
							this.error = snapshot.context.error;
						} else {
							this.error = "";
						}
						this.requestUpdate();
					});

					this.requestUpdate();
				}
			} else {
				// Если appContext ещё не готов, ждём немного
				setTimeout(setupAuth, 100);
			}
		};

		setupAuth();

		// Слушаем переключение между login/signup
		window.addEventListener("auth-switch-to-signup", () => {
			this.showSignup = true;
			this.requestUpdate();
		});

		window.addEventListener("auth-switch-to-login", () => {
			this.showSignup = false;
			this.requestUpdate();
		});
	}

	handleLogout() {
		const authActor = window.appContext?.actorRegistry.get("auth");
		if (authActor) {
			authActor.send({ type: "LOGOUT" });
		}
	}

	render() {
		return html`
			<div class="container">
				<div class="header">
					<h1>Chat App</h1>
				</div>
				<div class="content">
					${this.authState === "checking" ||
					this.authState === "checkingSession"
						? html`<p>Checking session...</p>`
						: this.authState === "authenticated"
							? html`
									<div class="authenticated">
										<h2>✅ Authenticated!</h2>
										<p>Welcome to the app!</p>
										<button @click=${this.handleLogout}>Logout</button>
									</div>
								`
							: html`
									${this.showSignup
										? html`<signup-form></signup-form>`
										: html`<login-form></login-form>`}
									${this.error
										? html`<div style="color: red; margin-top: 1rem;">
												${this.error}
											</div>`
										: ""}
								`}
				</div>
			</div>
		`;
	}
}

customElements.define("app-shell", AppShell);
