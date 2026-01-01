// Shell Feature
export const shellFeature = {
	id: "shell",
	name: "Shell",
	version: "1.0.0",

	dependencies: ["auth"],

	async onMount(context) {
		console.log("✅ Shell feature mounted");

		// Импортируем UI компоненты (auth UI тоже нужен)
		await import("../auth/auth.ui.js");
		await import("./shell.ui.js");

		// Рендерим shell в DOM
		if (typeof document !== "undefined") {
			const appContainer = document.getElementById("app");
			if (appContainer) {
				// Очищаем контейнер и добавляем shell
				appContainer.innerHTML = "";
				const shell = document.createElement("app-shell");
				appContainer.appendChild(shell);
			} else {
				// Если #app не найден, добавляем в body
				const shell = document.createElement("app-shell");
				document.body.appendChild(shell);
			}
		}

		return {};
	},

	async onUnmount(context) {
		// Cleanup если нужно
		const shell = document.querySelector("app-shell");
		if (shell) {
			shell.remove();
		}
	},
};
