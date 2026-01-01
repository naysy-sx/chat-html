// Identity Feature
import { identityService } from "./identity.service.js";

export const identityFeature = {
	id: "identity",
	name: "Identity",
	version: "1.0.0",

	dependencies: ["persistence", "crypto"],

	async onMount(context) {
		console.log("✅ Identity feature mounted");
		return { service: identityService };
	},

	async onUnmount(context) {
		// Cleanup если нужно
	},
};
