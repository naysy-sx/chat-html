// src/features/contacts/contacts.repository.js

const DB_NAME = 'ChatAppDB';
const STORE_NAME = 'contacts';
const DB_VERSION = 3; // Убедитесь что версия совпадает с persistence.service.js

export class ContactsRepository {
	constructor(owner) {
		this.db = null;
		this.owner = owner;

		if (!owner) {
			console.error('❌ ContactsRepository: owner is required!');
		}
	}

	async init() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error('❌ IndexedDB open error:', request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				this.db = request.result;
				console.log('✅ Contacts repository initialized');
				resolve();
			};

			request.onupgradeneeded = (e) => {
				const db = e.target.result;

				// Store создаётся в persistence.service.js при версии 2+
				// Здесь нам просто нужно убедиться, что индексы существуют
				if (db.objectStoreNames.contains(STORE_NAME)) {
					const store = e.target.transaction.objectStore(STORE_NAME);
					if (e.oldVersion < 3) {
						console.log('🔄 Migrating contacts to v3 schema...');
					}
					// Добавляем индексы если их ещё нет
					if (!store.indexNames.contains('username')) {
						store.createIndex('username', 'username', { unique: false });
					}
					if (!store.indexNames.contains('owner')) {
						store.createIndex('owner', 'owner', { unique: false });
					}
					if (!store.indexNames.contains('status')) {
						store.createIndex('status', 'status', { unique: false });
					}
					if (!store.indexNames.contains('addedAt')) {
						store.createIndex('addedAt', 'addedAt', { unique: false });
					}
					console.log('📊 Contacts indices checked');
				}
			};
		});
	}

	// Генерация составного ключа
	_getCompositeKey(contactId) {
		return `${this.owner}:${contactId}`;
	}

	// ===== Contacts CRUD =====

	async addContact(contact) {
		return new Promise((resolve, reject) => {
			const contactWithOwner = {
				...contact,
				owner: this.owner,
				compositeKey: this._getCompositeKey(contact.id),
			};

			const tx = this.db.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.add(contactWithOwner);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				console.log('✅ Contact added:', contact.id?.slice(0, 16));
				resolve();
			};
		});
	}

	async updateContact(contact) {
		return new Promise((resolve, reject) => {
			const contactWithOwner = {
				...contact,
				owner: this.owner,
				compositeKey: this._getCompositeKey(contact.id),
			};

			const tx = this.db.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.put(contactWithOwner);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				console.log('✅ Contact updated:', contact.id?.slice(0, 16));
				resolve();
			};
		});
	}

	async getContact(id) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([STORE_NAME], 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(this._getCompositeKey(id));

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || null);
		});
	}

	async getAllContacts() {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([STORE_NAME], 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const index = store.index('owner');
			const request = index.getAll(this.owner); // ✅ Только контакты этого пользователя!

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const contacts = request.result || [];
				console.log(`📊 Loaded ${contacts.length} contacts for ${this.owner}`);
				resolve(contacts);
			};
		});
	}

	async getContactsByStatus(status) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([STORE_NAME], 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const index = store.index('owner');
			const request = index.getAll(this.owner);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				// Фильтруем по статусу на клиенте
				const filtered = (request.result || []).filter(
					(c) => c.status === status
				);
				resolve(filtered);
			};
		});
	}

	async deleteContact(id) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const request = store.delete(this._getCompositeKey(id));

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				console.log(
					'✅ Contact deleted:',
					id?.slice(0, 16),
					'owner:',
					this.owner
				);
				resolve();
			};
		});
	}

	// ===== Blocking (заглушки — пока без отдельного store) =====
	// TODO: В будущем добавить полноценный blocked_contacts store

	/**
	 * Заглушка: Заблокировать контакт
	 * Пока просто логируем — блокировка будет только на стороне сервера
	 */
	async blockContact(contactId) {
		console.log('🚫 blockContact (stub):', contactId?.slice(0, 16));
		// TODO: Сохранить в localStorage или отдельный store
		const blocked = this._getBlockedFromStorage();
		blocked.add(contactId);
		this._saveBlockedToStorage(blocked);
	}
	// ===== Groups =====

	/**
	 * Получить список уникальных групп из контактов
	 * @returns {Promise<string[]>}
	 */
	async getGroups() {
		const contacts = await this.getAllContacts();
		const groups = new Set(['Default']); // Default всегда есть

		contacts.forEach((contact) => {
			if (contact.group && contact.status === 'accepted') {
				groups.add(contact.group);
			}
		});

		return Array.from(groups).sort((a, b) => {
			// Default всегда первый
			if (a === 'Default') return -1;
			if (b === 'Default') return 1;
			return a.localeCompare(b, 'ru');
		});
	}
	/**
	 * Заглушка: Добавить в список "нас заблокировали"
	 */
	async addBlockedBy(contactId) {
		console.log('🚫 addBlockedBy (stub):', contactId?.slice(0, 16));
		const blockedBy = this._getBlockedByFromStorage();
		blockedBy.add(contactId);
		this._saveBlockedByToStorage(blockedBy);
	}

	/**
	 * Заглушка: Проверить заблокирован ли контакт
	 */
	async isBlocked(contactId) {
		const blocked = this._getBlockedFromStorage();
		const blockedBy = this._getBlockedByFromStorage();
		return blocked.has(contactId) || blockedBy.has(contactId);
	}

	/**
	 * Заглушка: Получить все заблокированные
	 */
	async getBlockedContacts() {
		const blocked = this._getBlockedFromStorage();
		return Array.from(blocked).map((id) => ({ id, type: 'blocked' }));
	}

	// Helpers для localStorage
	_getBlockedFromStorage() {
		try {
			const data = localStorage.getItem('blocked_contacts');
			return new Set(data ? JSON.parse(data) : []);
		} catch {
			return new Set();
		}
	}

	_saveBlockedToStorage(set) {
		localStorage.setItem('blocked_contacts', JSON.stringify(Array.from(set)));
	}

	_getBlockedByFromStorage() {
		try {
			const data = localStorage.getItem('blocked_by_contacts');
			return new Set(data ? JSON.parse(data) : []);
		} catch {
			return new Set();
		}
	}

	_saveBlockedByToStorage(set) {
		localStorage.setItem(
			'blocked_by_contacts',
			JSON.stringify(Array.from(set))
		);
	}

	// ===== Utils =====

	async clear() {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([STORE_NAME], 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const index = store.index('owner');
			const request = index.openCursor(IDBKeyRange.only(this.owner));

			request.onerror = () => reject(request.error);
			request.onsuccess = (event) => {
				const cursor = event.target.result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				} else {
					console.log(`✅ Cleared all contacts for ${this.owner}`);
					resolve();
				}
			};
		});
	}

	close() {
		if (this.db) {
			this.db.close();
			console.log('🔌 Contacts repository closed');
		}
	}
}
