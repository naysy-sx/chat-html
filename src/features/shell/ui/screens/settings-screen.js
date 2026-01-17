// src/features/shell/ui/screens/settings-screen.js

import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../../../../shared/ui/index.js';
import { applyTheme } from '../../../../shared/utils/theme-utils.js';

export class SettingsScreen extends LitElement {
	static properties = {
		appSettingsActor: { type: Object },
		_settings: { state: true },
		_state: { state: true },
		_error: { state: true },
		_hasChanges: { state: true },
		// ✅ Состояние для drag & drop
		_draggedIndex: { state: true },
		_dragOverIndex: { state: true },
		_previewDesign: { state: true },
	};

	static styles = [
		buttonStyles,
		css`
			:host {
				display: block;
				height: 100%;
				overflow-y: auto;
			}

			.settings-container {
				max-width: 800px;
				margin: 0 auto;
				padding: var(--space-l);
			}

			.title {
				font-size: var(--text-2xl);
				font-weight: 600;
				color: var(--color-text-main);
				margin: 0 0 var(--space-l);
			}

			.section {
				background: var(--color-surface);
				border: 1px solid var(--color-border);
				border-radius: var(--radius-l);
				padding: var(--space-l);
				margin-bottom: var(--space-l);
			}

			.section-title {
				font-size: var(--text-lg);
				font-weight: 600;
				color: var(--color-text-main);
				margin: 0 0 var(--space-m);
			}

			.section-description {
				font-size: var(--text-sm);
				color: var(--color-text-muted);
				margin-bottom: var(--space-m);
			}

			.menu-items {
				display: flex;
				flex-direction: column;
				gap: var(--space-s);
			}

			.menu-item {
				display: flex;
				align-items: center;
				gap: var(--space-m);
				padding: var(--space-m);
				background: var(--color-bg);
				border: 1px solid var(--color-border);
				border-radius: var(--radius-m);
				transition: all var(--transition-fast);
				cursor: grab;
				user-select: none;
			}

			.menu-item:hover {
				background: var(--color-bg-hover);
			}

			.menu-item.disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			/* ✅ Стили для drag & drop */
			.menu-item.dragging {
				opacity: 0.5;
				cursor: grabbing;
				background: var(--color-primary-soft, #e0f2fe);
				border-color: var(--color-primary);
				transform: scale(1.02);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			}

			.menu-item.drag-over {
				border-color: var(--color-primary);
				background: var(--color-primary-soft, #e0f2fe);
			}

			.menu-item.drag-over-top {
				border-top: 3px solid var(--color-primary);
				margin-top: -2px;
			}

			.menu-item.drag-over-bottom {
				border-bottom: 3px solid var(--color-primary);
				margin-bottom: -2px;
			}

			/* ✅ Ручка для перетаскивания */
			.drag-handle {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 24px;
				height: 24px;
				color: var(--color-text-muted);
				cursor: grab;
				flex-shrink: 0;
				border-radius: var(--radius-s);
				transition: all var(--transition-fast);
			}

			.drag-handle:hover {
				background: var(--color-bg-hover);
				color: var(--color-text-main);
			}

			.drag-handle:active {
				cursor: grabbing;
			}

			.drag-handle-icon {
				font-size: 14px;
				line-height: 1;
			}

			.menu-item-icon {
				font-size: 1.5rem;
				width: 2rem;
				text-align: center;
				flex-shrink: 0;
			}

			.menu-item-info {
				flex: 1;
				min-width: 0;
			}

			.menu-item-label {
				font-weight: 500;
				color: var(--color-text-main);
				margin-bottom: var(--space-xs);
			}

			.menu-item-id {
				font-size: var(--text-xs);
				color: var(--color-text-muted);
				font-family: monospace;
			}

			.toggle-switch {
				position: relative;
				display: inline-block;
				width: 48px;
				height: 24px;
				flex-shrink: 0;
			}

			.toggle-switch input {
				opacity: 0;
				width: 0;
				height: 0;
			}

			.slider {
				position: absolute;
				cursor: pointer;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background-color: var(--color-border);
				transition: 0.3s;
				border-radius: 24px;
			}

			.slider:before {
				position: absolute;
				content: '';
				height: 18px;
				width: 18px;
				left: 3px;
				bottom: 3px;
				background-color: white;
				transition: 0.3s;
				border-radius: 50%;
			}

			input:checked + .slider {
				background-color: var(--color-primary);
			}

			input:checked + .slider:before {
				transform: translateX(24px);
			}

			input:disabled + .slider {
				cursor: not-allowed;
				opacity: 0.5;
			}

			.locked-badge {
				background: var(--color-warning-soft, #fef3c7);
				color: var(--color-warning, #f59e0b);
				font-size: var(--text-xs);
				padding: 2px 8px;
				border-radius: 12px;
				font-weight: 500;
				margin-left: var(--space-s);
			}

			.actions {
				display: flex;
				gap: var(--space-m);
				justify-content: flex-end;
				margin-top: var(--space-l);
			}

			.error-banner {
				padding: var(--space-m);
				background: var(--color-danger-soft);
				border: 1px solid var(--color-danger-border);
				border-radius: var(--radius-m);
				color: var(--color-danger-text);
				margin-bottom: var(--space-l);
			}

			.success-banner {
				padding: var(--space-m);
				background: var(--color-success-soft, #d1fae5);
				border: 1px solid var(--color-success-border, #6ee7b7);
				border-radius: var(--radius-m);
				color: var(--color-success-text, #065f46);
				margin-bottom: var(--space-l);
			}

			.loading {
				text-align: center;
				padding: var(--space-xl);
				color: var(--color-text-muted);
			}

			.empty-state {
				text-align: center;
				padding: var(--space-2xl);
				color: var(--color-text-muted);
			}

			.hint {
				font-size: var(--text-sm);
				color: var(--color-text-muted);
				margin-top: var(--space-s);
			}

			/* ✅ Drop indicator line */
			.drop-indicator {
				height: 3px;
				background: var(--color-primary);
				border-radius: 2px;
				margin: var(--space-xs) 0;
				opacity: 0;
				transition: opacity var(--transition-fast);
			}

			.drop-indicator.visible {
				opacity: 1;
			}
		`,
	];

	constructor() {
		super();
		this._settings = null;
		this._state = 'loading';
		this._error = null;
		this._hasChanges = false;
		this._subscription = null;
		this._originalSettings = null;
		// ✅ Инициализация drag state
		this._draggedIndex = null;
		this._dragOverIndex = null;
	}

	connectedCallback() {
		super.connectedCallback();
		this._subscribe();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._subscription?.unsubscribe();
	}

	updated(changedProperties) {
		if (changedProperties.has('appSettingsActor') && this.appSettingsActor) {
			this._subscribe();
		}
		if (this._settings && !this._previewDesign) {
			this._previewDesign = { ...this._settings.design };
			applyTheme(this._previewDesign);
		}
	}
	// Обработчик изменения ползунков (Realtime Preview)
	_handleDesignChange(key, value) {
		this._previewDesign = {
			...this._previewDesign,
			[key]: parseFloat(value),
		};

		// 🚀 Магия Realtime: применяем CSS переменные сразу же
		applyTheme(this._previewDesign);

		// Помечаем, что есть изменения для сохранения
		this._hasChanges = true;
		this.requestUpdate();
	}

	_handleReset() {
		// ... логика сброса объекта настроек ...
		this._previewDesign = { ...this._originalSettings.design };
		applyTheme(this._previewDesign); // Возвращаем визуально как было
		// ...
	}
	_handleSave() {
		// Обновляем основной объект settings перед отправкой
		this._settings.design = this._previewDesign;

		this.appSettingsActor.send({
			type: 'UPDATE_SETTINGS', // Тебе нужно будет добавить этот ивент в машину, если его нет
			settings: this._settings,
		});
		// ...
	}
	_subscribe() {
		if (!this.appSettingsActor) {
			console.warn('[settings-screen] No appSettingsActor provided');
			return;
		}

		this._subscription?.unsubscribe();

		const sync = (snapshot) => {
			this._state = snapshot.matches('ready')
				? 'ready'
				: snapshot.matches('saving')
				? 'saving'
				: snapshot.matches('loading')
				? 'loading'
				: 'error';

			this._settings = snapshot.context.settings
				? JSON.parse(JSON.stringify(snapshot.context.settings))
				: null;

			this._error = snapshot.context.error;

			if (!this._originalSettings && this._settings) {
				this._originalSettings = JSON.parse(JSON.stringify(this._settings));
			}

			this._checkForChanges();
		};

		sync(this.appSettingsActor.getSnapshot());
		this._subscription = this.appSettingsActor.subscribe(sync);
	}

	_checkForChanges() {
		if (!this._settings || !this._originalSettings) {
			this._hasChanges = false;
			return;
		}

		const current = JSON.stringify(this._settings.navigation.items);
		const original = JSON.stringify(this._originalSettings.navigation.items);

		this._hasChanges = current !== original;
	}

	render() {
		const design = this._previewDesign ||
			this._settings.design || {
				themeHue: 270,
				spacingScale: 1,
				fontSizeScale: 1,
			};

		if (this._state === 'loading') {
			return html`
				<div class="settings-container">
					<div class="loading">Загрузка настроек...</div>
				</div>
			`;
		}

		if (!this._settings) {
			return html`
				<div class="settings-container">
					<div class="empty-state">
						<h3>⚙️ Настройки недоступны</h3>
						<p>Не удалось загрузить настройки приложения</p>
					</div>
				</div>
			`;
		}

		return html`
			<div class="settings-container">
				<div class="section">
					<h3 class="section-title">🎨 Внешний вид</h3>
					<p class="section-description">
						Настройте цветовую гамму и масштаб интерфейса под себя.
					</p>

					<div class="design-controls">
						<!-- 1. Акцентный цвет -->
						<div class="control-group">
							<label>Акцентный цвет (Hue: ${design.themeHue})</label>
							<div class="range-wrapper">
								<input
									type="range"
									min="0"
									max="360"
									step="5"
									.value=${design.themeHue}
									@input=${(e) =>
										this._handleDesignChange('themeHue', e.target.value)}
								/>
								<!-- Показываем текущий цвет -->
								<div
									class="color-preview"
									style="background: oklch(60% 0.3 ${design.themeHue})"
								></div>
							</div>
						</div>

						<!-- 2. Размер интерфейса (Текст) -->
						<div class="control-group">
							<label
								>Масштаб текста
								(${Math.round(design.fontSizeScale * 100)}%)</label
							>
							<input
								type="range"
								min="0.8"
								max="1.3"
								step="0.05"
								.value=${design.fontSizeScale}
								@input=${(e) =>
									this._handleDesignChange('fontSizeScale', e.target.value)}
							/>
						</div>

						<!-- 3. Плотность интерфейса (Spacing) -->
						<div class="control-group">
							<label>Плотность отступов (x${design.spacingScale})</label>
							<input
								type="range"
								min="0.5"
								max="1.5"
								step="0.1"
								.value=${design.spacingScale}
								@input=${(e) =>
									this._handleDesignChange('spacingScale', e.target.value)}
							/>
							<div class="hint">Меньше — компактнее, Больше — просторнее</div>
						</div>
					</div>
				</div>

				<h2 class="title">⚙️ Меню</h2>

				${this._error
					? html`<div class="error-banner">⚠️ ${this._error}</div>`
					: ''}
				${this._state === 'saving'
					? html`<div class="success-banner">💾 Сохранение...</div>`
					: ''}

				<!-- Настройка меню -->
				<div class="section">
					<h3 class="section-title">Отображение меню</h3>
					<p class="section-description">
						Выберите, какие пункты меню будут отображаться в боковой панели.
						Перетаскивайте элементы для изменения порядка.
					</p>

					<div class="menu-items">
						${this._settings.navigation.items.map((item, index) =>
							this._renderMenuItem(item, index)
						)}
					</div>

					<p class="hint">
						💡 Перетаскивайте элементы за иконку ⋮⋮ для изменения порядка.
						Пункты с замком нельзя скрыть.
					</p>
				</div>

				<!-- Действия -->
				<div class="actions">
					<button
						class="btn btn--secondary"
						@click=${this._handleReset}
						?disabled=${!this._hasChanges || this._state === 'saving'}
					>
						Сбросить
					</button>
					<button
						class="btn btn--primary"
						@click=${this._handleSave}
						?disabled=${!this._hasChanges || this._state === 'saving'}
					>
						${this._state === 'saving' ? 'Сохранение...' : 'Сохранить'}
					</button>
				</div>
			</div>
		`;
	}

	_renderMenuItem(item, index) {
		const isLocked = item.locked || false;
		const isDisabled = isLocked && item.visible;
		const isDragging = this._draggedIndex === index;
		const isDragOver = this._dragOverIndex === index;

		const classes = [
			'menu-item',
			isDisabled ? 'disabled' : '',
			isDragging ? 'dragging' : '',
			isDragOver && this._draggedIndex !== null ? 'drag-over' : '',
		]
			.filter(Boolean)
			.join(' ');

		return html`
			<div
				class=${classes}
				draggable="true"
				data-index=${index}
				@dragstart=${(e) => this._handleDragStart(e, index)}
				@dragend=${this._handleDragEnd}
				@dragover=${(e) => this._handleDragOver(e, index)}
				@dragenter=${(e) => this._handleDragEnter(e, index)}
				@dragleave=${this._handleDragLeave}
				@drop=${(e) => this._handleDrop(e, index)}
			>
				<!-- ✅ Drag handle -->
				<span class="drag-handle" title="Перетащите для изменения порядка">
					<span class="drag-handle-icon">⋮⋮</span>
				</span>

				<span class="menu-item-icon">${item.icon}</span>
				<div class="menu-item-info">
					<div class="menu-item-label">
						${item.label}
						${isLocked
							? html`<span class="locked-badge">🔒 Обязательный</span>`
							: ''}
					</div>
					<div class="menu-item-id">${item.id}</div>
				</div>
				<label class="toggle-switch" @click=${(e) => e.stopPropagation()}>
					<input
						type="checkbox"
						?checked=${item.visible}
						?disabled=${isLocked}
						@change=${() => this._handleToggleVisibility(item.id)}
					/>
					<span class="slider"></span>
				</label>
			</div>
		`;
	}

	// ✅ Drag & Drop handlers
	_handleDragStart(e, index) {
		this._draggedIndex = index;

		// Настраиваем drag image
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', index.toString());

		// Добавляем небольшую задержку для визуального эффекта
		requestAnimationFrame(() => {
			this.requestUpdate();
		});

		console.log('🎯 Drag start:', index);
	}

	_handleDragEnd() {
		console.log('🏁 Drag end');
		this._draggedIndex = null;
		this._dragOverIndex = null;
		this.requestUpdate();
	}

	_handleDragOver(e, index) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';

		if (this._draggedIndex !== null && this._draggedIndex !== index) {
			this._dragOverIndex = index;
		}
	}

	_handleDragEnter(e, index) {
		e.preventDefault();

		if (this._draggedIndex !== null && this._draggedIndex !== index) {
			this._dragOverIndex = index;
			this.requestUpdate();
		}
	}

	_handleDragLeave(e) {
		// Проверяем, что мы действительно покинули элемент
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;

		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			// Не сбрасываем _dragOverIndex здесь, чтобы избежать мерцания
		}
	}

	_handleDrop(e, toIndex) {
		e.preventDefault();

		const fromIndex = this._draggedIndex;

		if (fromIndex === null || fromIndex === toIndex) {
			this._draggedIndex = null;
			this._dragOverIndex = null;
			return;
		}

		console.log('📦 Drop:', fromIndex, '→', toIndex);

		// Обновляем локальное состояние
		this._reorderItems(fromIndex, toIndex);

		// Сбрасываем drag state
		this._draggedIndex = null;
		this._dragOverIndex = null;
	}

	_reorderItems(fromIndex, toIndex) {
		if (!this._settings) return;

		const items = [...this._settings.navigation.items];
		const [movedItem] = items.splice(fromIndex, 1);
		items.splice(toIndex, 0, movedItem);

		// Пересчитываем order для всех элементов
		const reorderedItems = items.map((item, index) => ({
			...item,
			order: index,
		}));

		this._settings = {
			...this._settings,
			navigation: {
				items: reorderedItems,
			},
		};

		this._checkForChanges();
		this.requestUpdate();

		console.log(
			'🔄 Items reordered:',
			reorderedItems.map((i) => `${i.id}:${i.order}`).join(', ')
		);
	}

	_handleToggleVisibility(itemId) {
		if (!this._settings) return;

		const updatedItems = this._settings.navigation.items.map((item) =>
			item.id === itemId ? { ...item, visible: !item.visible } : item
		);

		this._settings = {
			...this._settings,
			navigation: {
				items: updatedItems,
			},
		};

		this._checkForChanges();
		this.requestUpdate();
	}

	_handleSave() {
		if (!this.appSettingsActor || !this._hasChanges) return;

		console.log('💾 Saving app settings');

		this.appSettingsActor.send({
			type: 'UPDATE_NAVIGATION_ITEMS',
			items: this._settings.navigation.items,
		});

		this.appSettingsActor.send({ type: 'SAVE_SETTINGS' });

		this._originalSettings = JSON.parse(JSON.stringify(this._settings));
		this._hasChanges = false;
	}

	_handleReset() {
		if (!this._originalSettings) return;

		console.log('🔄 Resetting to original settings');

		this._settings = JSON.parse(JSON.stringify(this._originalSettings));
		this._hasChanges = false;
		this.requestUpdate();
	}
}

customElements.define('settings-screen', SettingsScreen);
