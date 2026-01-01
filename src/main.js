// Bootstrap entry
import { bootstrap } from "./runtime/bootstrap.js";

// Инициализация приложения
bootstrap()
	.then(({ appActor, context }) => {
		console.log("Application initialized successfully");
		// Делаем appActor доступным глобально для отладки
		if (typeof window !== "undefined") {
			window.appActor = appActor;
			window.appContext = context;
		}
	})
	.catch((error) => {
		console.error("Failed to bootstrap application:", error);
	});
