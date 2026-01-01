// Auth Feature
import { authMachine } from "./auth.machine.js";
import { createActor } from "xstate";

export const authFeature = {
	id: "auth",
	name: "Authentication",
	version: "1.0.0",

	dependencies: ["identity", "persistence"],

	async onMount(context) {
		const { eventBus, actorRegistry } = context;

		// Create auth actor
		const actor = createActor(authMachine, {
			id: "auth",
		});

		// Запускаем актор
		actor.start();

		// Регистрируем актор
		actorRegistry.register("auth", actor, {
			type: "feature",
			featureId: "auth",
		});

		// Подписываемся на события актора
		actor.subscribe((snapshot) => {
			if (snapshot.matches("authenticated")) {
				// Отправляем глобальное событие
				eventBus.dispatch(
					{
						type: "AUTH_SUCCESS",
						userId: snapshot.context.userId,
					},
					"HIGH"
				);
			}
			if (snapshot.matches("unauthenticated")) {
				eventBus.dispatch({ type: "AUTH_LOGOUT" }, "HIGH");
			}
		});

		// Подписываемся на UI события
		if (typeof window !== "undefined") {
			window.addEventListener("auth-login", (e) => {
				actor.send({
					type: "LOGIN",
					username: e.detail.username,
					password: e.detail.password,
				});
			});

			window.addEventListener("auth-signup", (e) => {
				actor.send({
					type: "SIGNUP",
					username: e.detail.username,
					password: e.detail.password,
				});
			});
		}

		return { actor };
	},

	async onUnmount(context) {
		context.actorRegistry.unregister("auth");
	},

	subscribedEvents: ["APP_READY", "LOGOUT", "SESSION_EXPIRED"],

	emittedEvents: ["AUTH_SUCCESS", "AUTH_FAILED", "AUTH_LOGOUT"],
};
