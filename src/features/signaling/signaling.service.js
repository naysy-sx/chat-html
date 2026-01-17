// src/features/signaling/signaling.service.js

/**
 * Транспортный слой для связи с сигнальным сервером
 * Поддерживает long polling с возможностью миграции на WebSocket
 */
export class SignalingService {
	constructor(serverUrl) {
		this.serverUrl = serverUrl;
		this.pollAbortController = null;
	}

	/**
	 * Обновить URL сервера (при переключении в настройках)
	 */
	setServerUrl(url) {
		this.serverUrl = url;
	}

	/**
	 * Регистрация пользователя на сервере
	 */
	async register(userId, publicKey) {
		return this._request('register', {
			userId,
			publicKey,
		});
	}

	/**
	 * Heartbeat для поддержания онлайн-статуса
	 */
	async heartbeat(userId) {
		return this._request('heartbeat', { userId });
	}

	/**
	 * Long polling для получения событий
	 * @returns {Promise<Array>} Массив событий или пустой массив
	 */
	async poll(userId, signal) {
		const url = new URL(this.serverUrl);
		url.searchParams.set('action', 'poll');
		url.searchParams.set('userId', userId);

		console.log(
			'📡 Poll request:',
			userId.slice(0, 16) + '...',
			'URL:',
			url.toString()
		);

		try {
			const response = await fetch(url.toString(), {
				method: 'GET',
				signal,
			});

			if (!response.ok) {
				throw new Error(`Poll failed: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Poll failed');
			}

			const events = data.data?.events || [];
			if (events.length > 0) {
				console.log(
					'📨 Poll got',
					events.length,
					'event(s) for',
					userId.slice(0, 16) + '...'
				);
			}

			return events;
		} catch (error) {
			if (error.name === 'AbortError') {
				return [];
			}
			throw error;
		}
	}

	/**
	 * Отправить приглашение
	 */
	async sendInvite(from, fromName, to, publicKey, profile = null) {
		return this._request('invite', {
			from,
			fromName,
			to,
			publicKey,
			avatar: profile?.avatar || null,
			bio: profile?.bio || null,
		});
	}

	/**
	 * Принять приглашение
	 */
	async acceptInvite(from, fromName, to, publicKey, profile = null) {
		return this._request('accept_invite', {
			from,
			fromName,
			to,
			publicKey,
			avatar: profile?.avatar || null,
			bio: profile?.bio || null,
		});
	}

	/**
	 * Отклонить приглашение
	 */
	async rejectInvite(from, fromName, to) {
		return this._request('reject_invite', {
			from,
			fromName,
			to,
		});
	}

	/**
	 * Отправить сообщение (зашифрованное)
	 */
	async sendMessage(from, to, messageData) {
		return this._request('send_message', {
			from,
			to,
			...messageData,
		});
	}

	/**
	 * Отправить обновление профиля
	 */
	async sendProfile(from, to, profile) {
		return this._request('send_profile', {
			from,
			to,
			name: profile.displayName || profile.name,
			avatar: profile.avatar || null,
			bio: profile.bio || null,
		});
	}

	/**
	 * Уведомить об удалении контакта
	 */
	async sendContactDeleted(from, to) {
		return this._request('contact_deleted', {
			from,
			to,
		});
	}
	async blockContact(from, to) {
		return this._request('block_contact', {
			from,
			to,
		});
	}
	/**
	 * Получить статусы контактов
	 */
	async getStatuses(userId, contactIds) {
		const result = await this._request('status', {
			userId,
			contacts: contactIds,
		});
		return result.statuses || {};
	}
	/**
	 * Базовый метод для POST-запросов
	 */
	async _request(action, body) {
		const url = new URL(this.serverUrl);
		url.searchParams.set('action', action);

		const response = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`Request failed: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || `Action ${action} failed`);
		}

		return data.data;
	}
	/**
	 * Отправить обновление профиля всем контактам из списка
	 */
	async broadcastProfile(from, contactIds, profile) {
		const promises = contactIds.map((toUserId) =>
			this.sendProfile(from, toUserId, profile).catch((err) => {
				console.warn(
					`⚠️ Failed to send profile to ${toUserId.slice(0, 16)}:`,
					err.message
				);
				// Не прерываем весь процесс из-за одной ошибки
			})
		);

		await Promise.allSettled(promises);
		console.log(
			`📢 Profile broadcast completed to ${contactIds.length} contacts`
		);
	}
}
