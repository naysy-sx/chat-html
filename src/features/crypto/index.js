// Crypto Feature
import { cryptoService } from "./crypto.service.js";

export const cryptoFeature = {
	id: "crypto",
	name: "Crypto",
	version: "1.0.0",

	async onMount(context) {
		console.log("✅ Crypto feature mounted");
		return { service: cryptoService };
	},

	async onUnmount(context) {
		// Cleanup если нужно
	},
};
