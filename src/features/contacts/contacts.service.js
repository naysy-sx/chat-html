// src/features/contacts/contacts.service.js

/**
 * Сервис для управления контактами
 */
export class ContactsService {
	constructor(repository, signalingActor, eventBus, profile = null) {
		this.repository = repository;
		this.signalingActor = signalingActor;
		this.eventBus = eventBus;
		this.profile = profile; // sender profile (displayName, avatar, bio)
	}

	async loadContacts() {
		const contacts = await this.repository.getAllContacts();
		return { contacts };
	}

	/**
	 * Добавить новый контакт (отправить приглашение)
	 * username теперь НЕ передаётся — берётся из профиля отправителя
	 */
	async addContact({ userId, exchangePublicKey, group }) {
		// Проверяем что контакт не существует
		const exists = await this.repository.getContact(userId);
		if (exists) {
			throw new Error('CONTACT_ALREADY_EXISTS');
		}

		// Проверяем что не заблокирован
		const isBlocked = await this.repository.isBlocked(userId);
		if (isBlocked) {
			throw new Error('CONTACT_IS_BLOCKED');
		}

		// Создаём контакт со статусом "исходящий запрос"
		// Имя будет обновлено когда контакт примет запрос
		const contact = {
			id: userId,
			username: 'Ожидание...', // Временное имя
			avatar: null,
			bio: null,
			group: group || null,
			exchangePublicKey,
			status: 'pending_outgoing',
			addedAt: Date.now(),
			lastSeen: null,
			isOnline: false,
			unreadCount: 0,
			lastMessage: null,
		};

		await this.repository.addContact(contact);

		// Отправляем приглашение через signaling, включая профиль отправителя если есть
		this.signalingActor.send({
			type: 'SEND_INVITE',
			toUserId: userId,
			profile: this.profile,
		});

		console.log(
			'✅ Contact added (pending_outgoing):',
			userId.slice(0, 16) + '...'
		);

		return contact;
	}

	async acceptContact(contactId, group) {
		const contact = await this.repository.getContact(contactId);
		if (!contact) {
			throw new Error('CONTACT_NOT_FOUND');
		}

		if (contact.status !== 'pending_incoming') {
			throw new Error('CONTACT_NOT_PENDING_INCOMING');
		}

		contact.status = 'accepted';
		contact.group = group || 'Default';
		await this.repository.updateContact(contact);

		this.signalingActor.send({
			type: 'ACCEPT_INVITE',
			toUserId: contactId,
			profile: this.profile,
		});

		console.log('✅ Contact accepted:', contactId.slice(0, 16) + '...');

		return contact;
	}

	async rejectContact(contactId) {
		const contact = await this.repository.getContact(contactId);
		if (!contact) {
			throw new Error('CONTACT_NOT_FOUND');
		}

		await this.repository.deleteContact(contactId);

		this.signalingActor.send({
			type: 'REJECT_INVITE',
			toUserId: contactId,
			profile: this.profile,
		});

		console.log('❌ Contact rejected:', contactId.slice(0, 16) + '...');
	}

	async cancelOutgoing(contactId) {
		const contact = await this.repository.getContact(contactId);
		if (!contact) {
			throw new Error('CONTACT_NOT_FOUND');
		}

		if (contact.status !== 'pending_outgoing') {
			throw new Error('CONTACT_NOT_PENDING_OUTGOING');
		}

		await this.repository.deleteContact(contactId);

		console.log(
			'❌ Outgoing request cancelled:',
			contactId.slice(0, 16) + '...'
		);
	}

	/**
	 * ✅ ОБНОВЛЕНО: Удалить и заблокировать контакт
	 */
	async deleteAndBlockContact(contactId) {
		// Добавляем в список заблокированных
		await this.repository.blockContact(contactId);

		// Удаляем из контактов
		await this.repository.deleteContact(contactId);

		// Уведомляем контакт о блокировке через signaling
		this.signalingActor.send({
			type: 'BLOCK_CONTACT',
			toUserId: contactId,
			profile: this.profile,
		});

		console.log(
			'🚫 Contact deleted and blocked:',
			contactId.slice(0, 16) + '...'
		);
	}

	/**
	 * Удалить контакт без блокировки (старое поведение)
	 */
	async deleteContact(contactId) {
		await this.repository.deleteContact(contactId);

		this.signalingActor.send({
			type: 'CONTACT_DELETED',
			toUserId: contactId,
			profile: this.profile,
		});

		console.log('🗑️ Contact deleted:', contactId.slice(0, 16) + '...');
	}

	async updateContactGroup(contactId, group) {
		const contact = await this.repository.getContact(contactId);
		if (!contact) {
			throw new Error('CONTACT_NOT_FOUND');
		}

		contact.group = group;
		await this.repository.updateContact(contact);

		console.log(
			'📝 Contact group updated:',
			contactId.slice(0, 16) + '...',
			group
		);

		return contact;
	}

	async getGroups() {
		return this.repository.getGroups();
	}

	/**
	 * ✅ ОБНОВЛЕНО: Обработать входящее приглашение С ПРОФИЛЕМ
	 */
	async handleIncomingInvite({ from, fromName, publicKey, avatar, bio }) {
		// Проверяем что не заблокирован нами
		const isBlocked = await this.repository.isBlocked(from);
		if (isBlocked) {
			console.warn(
				'⚠️ Invite from blocked contact, ignoring:',
				from.slice(0, 16) + '...'
			);
			return;
		}

		// Проверяем что контакт не существует
		const exists = await this.repository.getContact(from);
		if (exists) {
			console.warn('⚠️ Invite from existing contact, ignoring');
			return;
		}

		// Парсим публичный ключ
		let parsedKey = null;
		if (publicKey) {
			try {
				parsedKey = JSON.parse(publicKey);
			} catch (err) {
				try {
					const normalizeBase64 = (s) =>
						s.replace(/-/g, '+').replace(/_/g, '/');
					let b = String(publicKey).trim();
					b = normalizeBase64(b);
					while (b.length % 4 !== 0) b += '=';
					const binary = atob(b);
					const bytes = new Uint8Array(
						Array.from(binary).map((c) => c.charCodeAt(0))
					);
					parsedKey = new TextDecoder().decode(bytes);
					parsedKey = JSON.parse(parsedKey);
				} catch (err2) {
					console.warn(
						'Could not parse publicKey payload:',
						err2?.message || err2
					);
					parsedKey = null;
				}
			}
		}

		// ✅ Создаём контакт С ПРОФИЛЕМ отправителя
		const contact = {
			id: from,
			username: fromName || 'Неизвестный пользователь',
			avatar: avatar || null, // ✅ Аватар из invite
			bio: bio || null, // ✅ Bio из invite
			group: null,
			exchangePublicKey: parsedKey,
			status: 'pending_incoming',
			addedAt: Date.now(),
			lastSeen: Date.now(),
			isOnline: true, // Раз отправил invite — онлайн
			unreadCount: 0,
			lastMessage: null,
		};

		await this.repository.addContact(contact);

		console.log(
			'📨 Incoming invite received:',
			from.slice(0, 16) + '...',
			'name:',
			fromName,
			'hasAvatar:',
			!!avatar
		);

		this.eventBus?.dispatch({
			type: 'CONTACTS_INVITE_RECEIVED',
			contact,
		});
	}

	/**
	 * ✅ ОБНОВЛЕНО: Обработать принятие нашего приглашения С ПРОФИЛЕМ
	 */
	async handleInviteAccepted({ from, fromName, avatar, bio }) {
		const contact = await this.repository.getContact(from);
		if (!contact) {
			console.warn('⚠️ Invite accepted from unknown contact');
			return;
		}

		// ✅ Обновляем профиль контакта
		contact.status = 'accepted';
		contact.group = contact.group || 'Default';
		contact.username =
			fromName || contact.username || 'Неизвестный пользователь';
		contact.avatar = avatar || contact.avatar;
		contact.bio = bio || contact.bio;
		contact.lastSeen = Date.now();
		contact.isOnline = true;

		await this.repository.updateContact(contact);

		console.log(
			'✅ Invite accepted by:',
			from.slice(0, 16) + '...',
			'name:',
			fromName,
			'hasAvatar:',
			!!avatar
		);

		this.eventBus?.dispatch({
			type: 'CONTACTS_INVITE_ACCEPTED',
			contact,
		});
	}

	async handleInviteRejected({ from }) {
		const contact = await this.repository.getContact(from);
		if (!contact) return;

		await this.repository.deleteContact(from);

		console.log('❌ Invite rejected by:', from.slice(0, 16) + '...');

		this.eventBus?.dispatch({
			type: 'CONTACTS_INVITE_REJECTED',
			contactId: from,
		});
	}

	async handleProfileUpdate({ from, name, avatar, bio }) {
		const contact = await this.repository.getContact(from);
		if (!contact) {
			console.warn(
				'⚠️ Profile update from unknown contact:',
				from.slice(0, 16) + '...'
			);
			return;
		}

		// Обновляем профиль
		if (name) contact.username = name;
		if (avatar !== undefined) contact.avatar = avatar;
		if (bio !== undefined) contact.bio = bio;

		await this.repository.updateContact(contact);

		console.log('📝 Profile updated for:', from.slice(0, 16) + '...');

		this.eventBus?.dispatch({
			type: 'CONTACTS_PROFILE_UPDATED',
			contactId: from,
		});
	}

	/**
	 * ✅ НОВОЕ: Обработать блокировку от контакта
	 */
	async handleContactBlocked({ from }) {
		// Нас заблокировали — удаляем контакт и добавляем в "заблокировавшие нас"
		await this.repository.addBlockedBy(from);
		await this.repository.deleteContact(from);

		console.log('🚫 Blocked by:', from.slice(0, 16) + '...');

		this.eventBus?.dispatch({
			type: 'CONTACTS_BLOCKED_BY',
			contactId: from,
		});
	}

	async handleContactDeleted({ from }) {
		await this.repository.deleteContact(from);

		console.log('🗑️ Contact deleted remotely:', from.slice(0, 16) + '...');

		this.eventBus?.dispatch({
			type: 'CONTACTS_CONTACT_DELETED',
			contactId: from,
		});
	}

	async markAsRead(contactId) {
		await this.repository.markAsRead(contactId);
	}

	async updateLastMessage(contactId, message, incrementUnread = false) {
		await this.repository.updateLastMessage(
			contactId,
			message,
			incrementUnread
		);
	}
	async getAcceptedContactIds() {
		const contacts = await this.repository.getAllContacts();
		return contacts.filter((c) => c.status === 'accepted').map((c) => c.id);
	}
}
