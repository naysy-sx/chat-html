// src/features/shell/index.js

import { createActor } from 'xstate';
import { createShellMachine } from './shell.machine.js';

export const shellFeature = {
	id: 'shell',
	name: 'Shell',
	version: '1.0.0',

	dependencies: ['auth'],

	ui: {
		main: 'app-shell',
	},

	async onMount(mountContext) {
		console.log('🐚 Mounting Shell feature...');

		// Получаем auth actor
		const authResult = mountContext.featureRegistry.getMountResult('auth');

		if (!authResult?.actor) {
			throw new Error('Auth actor not available');
		}

		const authActor = authResult.actor;

		// Создаём shell machine
		const shellMachine = createShellMachine({ authActor });
		const shellActor = createActor(shellMachine);

		// Подписываемся на auth state и синхронизируем с shell
		const authSnapshot = authActor.getSnapshot();
		shellActor.send({
			type: 'AUTH_STATE_CHANGED',
			isAuthenticated: authSnapshot.value === 'authenticated',
			username: authSnapshot.context.username,
		});

		// Запускаем shell actor
		shellActor.start();

		// Следим за изменениями auth
		const authSub = authActor.subscribe((snapshot) => {
			shellActor.send({
				type: 'AUTH_STATE_CHANGED',
				isAuthenticated: snapshot.value === 'authenticated',
				username: snapshot.context.username,
			});
		});

		// Регистрируем в actor registry
		if (mountContext.actorRegistry) {
			mountContext.actorRegistry.register('shell', shellActor, {
				type: 'feature',
				feature: 'shell',
			});
		}

		// Импортируем UI
		await import('./shell.ui.js');

		// Рендерим shell в DOM
		const appContainer = document.getElementById('app');

		if (appContainer) {
			appContainer.innerHTML = '';

			const shell = document.createElement('app-shell');

			// Передаём actors в shell UI
			shell.authActor = authActor;
			shell.shellActor = shellActor;
			shell.featureRegistry = mountContext.featureRegistry;
			shell.actorRegistry = mountContext.actorRegistry; // ← Передаём actorRegistry
			shell.eventBus = mountContext.eventBus;

			appContainer.appendChild(shell);
		}

		console.log('✅ Shell feature mounted');

		return {
			actor: shellActor,
			element: document.querySelector('app-shell'),
			cleanup: () => {
				authSub.unsubscribe();
			},
		};
	},

	async onUnmount(context) {
		const shell = document.querySelector('app-shell');
		shell?.remove();

		// Cleanup подписки
		if (context.cleanup) {
			context.cleanup();
		}

		// Останавливаем actor
		if (context.actor) {
			context.actor.stop();
		}

		console.log('🐚 Shell feature unmounted');
	},
};
