import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
	publicDir: "public", // Статические файлы (workers, sw.js, manifest.json)

	build: {
		outDir: "dist",
		emptyOutDir: true,
		target: "esnext",
		minify: "esbuild", // Используем esbuild (встроен в Vite) вместо terser
		// Для удаления console.log можно использовать esbuild или terser
		// Если нужен terser, установите: npm install -D terser
		rollupOptions: {
			output: {
				inlineDynamicImports: true, // Важно для single-file
			},
		},
		cssCodeSplit: false, // Важно для single-file
	},

	plugins: [
		viteSingleFile({
			removeViteModuleLoader: true,
			useRecommendedBuildConfig: true,
		}),
	],

	server: {
		port: 3000,
		open: true,
	},

	resolve: {
		alias: {
			"@": "/src",
		},
	},
});
