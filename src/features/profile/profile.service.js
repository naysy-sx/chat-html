// src/features/profile/profile.service.js

export class ProfileService {
	// Константы
	static DEFAULT_SIGNALING_SERVER =
		'https://functions.yandexcloud.net/d4eembfgfpdabtj2no3m';

	// Валидация username (для displayName)
	validateUsername(username) {
		if (!username || username.trim().length === 0) {
			return { valid: false, error: 'Имя не может быть пустым' };
		}

		if (username.length < 3) {
			return {
				valid: false,
				error: 'Имя должно содержать минимум 3 символа',
			};
		}

		if (username.length > 32) {
			return {
				valid: false,
				error: 'Имя не может превышать 32 символа',
			};
		}

		// Проверка на допустимые символы
		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			return {
				valid: false,
				error: 'Имя может содержать только буквы, цифры, дефис и подчёркивание',
			};
		}

		return { valid: true };
	}

	// Валидация пароля
	validatePassword(password) {
		if (!password || password.length < 4) {
			return {
				valid: false,
				error: 'Пароль должен содержать минимум 4 символа',
			};
		}

		if (password.length > 128) {
			return {
				valid: false,
				error: 'Пароль не может превышать 128 символов',
			};
		}

		return { valid: true };
	}

	// Валидация bio
	validateBio(bio) {
		if (!bio) return { valid: true };

		if (bio.length > 500) {
			return {
				valid: false,
				error: 'Биография не может превышать 500 символов',
			};
		}

		return { valid: true };
	}

	// Валидация URL сигнального сервера
	validateSignalingServerUrl(url) {
		if (!url || url.trim().length === 0) {
			return { valid: false, error: 'URL не может быть пустым' };
		}

		try {
			const parsed = new URL(url);
			// Разрешаем https, wss и ws
			if (
				parsed.protocol !== 'wss:' &&
				parsed.protocol !== 'ws:' &&
				parsed.protocol !== 'https:'
			) {
				return {
					valid: false,
					error: 'URL должен начинаться с https://, wss:// или ws://',
				};
			}
			return { valid: true };
		} catch (err) {
			return { valid: false, error: 'Некорректный URL' };
		}
	}

	// Генерация invitation key из identity
	generateInvitationKey(identity) {
		if (!identity || !identity.userId) {
			throw new Error('Invalid identity');
		}

		// Формат: userId в base64 (можно добавить версию, метаданные)
		const keyData = {
			v: 1, // версия формата
			uid: identity.userId,
			ts: Date.now(),
		};

		return btoa(JSON.stringify(keyData));
	}

	// Парсинг invitation key
	parseInvitationKey(key) {
		try {
			const decoded = JSON.parse(atob(key));

			if (!decoded.uid) {
				throw new Error('Invalid key format');
			}

			return {
				version: decoded.v || 1,
				userId: decoded.uid,
				timestamp: decoded.ts,
			};
		} catch (err) {
			throw new Error('Некорректный ключ приглашения');
		}
	}

	// Обработка аватара (crop to 200x200)
	async processAvatar(file) {
		return new Promise((resolve, reject) => {
			// Валидация типа файла
			if (!file.type.startsWith('image/')) {
				return reject(new Error('Файл должен быть изображением'));
			}

			// Валидация размера (макс 5MB)
			if (file.size > 5 * 1024 * 1024) {
				return reject(new Error('Размер файла не должен превышать 5MB'));
			}

			const reader = new FileReader();

			reader.onload = (e) => {
				const img = new Image();

				img.onload = () => {
					// Создаём canvas для обрезки
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');

					const size = 200;
					canvas.width = size;
					canvas.height = size;

					// Вычисляем crop (центрируем по меньшей стороне)
					const scale = Math.max(size / img.width, size / img.height);
					const scaledWidth = img.width * scale;
					const scaledHeight = img.height * scale;

					const x = (size - scaledWidth) / 2;
					const y = (size - scaledHeight) / 2;

					ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

					// Конвертируем в base64
					const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

					resolve(dataUrl);
				};

				img.onerror = () =>
					reject(new Error('Не удалось загрузить изображение'));
				img.src = e.target.result;
			};

			reader.onerror = () => reject(new Error('Ошибка чтения файла'));
			reader.readAsDataURL(file);
		});
	}

	// Получение начальных серверов (дефолтный + пользовательские)
	getInitialServers() {
		return [
			{
				id: 'default',
				url: ProfileService.DEFAULT_SIGNALING_SERVER,
				isDefault: true,
				label: 'Сервер разработчика',
			},
		];
	}

	// Добавление пользовательского сервера
	addCustomServer(servers, url) {
		const validation = this.validateSignalingServerUrl(url);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		// Проверяем дубликаты
		if (servers.some((s) => s.url === url)) {
			throw new Error('Этот сервер уже добавлен');
		}

		const newServer = {
			id: `custom_${Date.now()}`,
			url,
			isDefault: false,
			label: new URL(url).hostname,
			addedAt: Date.now(),
		};

		return [...servers, newServer];
	}

	// Удаление сервера
	removeServer(servers, serverId) {
		// Нельзя удалить дефолтный
		const server = servers.find((s) => s.id === serverId);
		if (server?.isDefault) {
			throw new Error('Нельзя удалить сервер разработчика');
		}

		return servers.filter((s) => s.id !== serverId);
	}
}
