// Persistence Service - IndexedDB wrapper
export class PersistenceService {
	constructor() {
		this.db = null;
		this.dbName = 'ChatAppDB';
		this.dbVersion = 3; // ✅ Версия 3
		this.writeQueue = [];
		this.flushTimer = null;
		this.flushInterval = 100; // 100ms
		this.maxBatchSize = 50;
	}

	async init() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = () => {
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = () => {
				this.db = request.result;
				console.log(
					'📦 IndexedDB opened:',
					this.dbName,
					'version:',
					this.dbVersion
				);
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				const oldVersion = event.oldVersion;

				console.log(
					`🔄 Upgrading DB from version ${oldVersion} to ${this.dbVersion}`
				);

				// Создаём/обновляем stores
				this.upgradeStores(db, oldVersion);
			};
		});
	}

	upgradeStores(db, oldVersion) {
		// Store для общих данных (settings, session, etc)
		if (!db.objectStoreNames.contains('data')) {
			db.createObjectStore('data', { keyPath: 'key' });
			console.log('✅ Created store: data');
		}

		// Store для сообщений
		if (!db.objectStoreNames.contains('messages')) {
			const messagesStore = db.createObjectStore('messages', {
				keyPath: 'id',
				autoIncrement: true,
			});
			messagesStore.createIndex('contactId', 'contactId', { unique: false });
			messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
			messagesStore.createIndex('owner', 'owner', { unique: false });
			console.log('✅ Created store: messages');
		}

		// ✅ МИГРАЦИЯ: Store для контактов с изменением keyPath
		if (oldVersion < 3) {
			// Если обновляемся с версии 2 или меньше
			if (db.objectStoreNames.contains('contacts')) {
				console.log('🔄 Migrating contacts store from v2 to v3...');

				// Удаляем старый store (данные потеряются, но это OK для миграции)
				db.deleteObjectStore('contacts');
				console.log('🗑️ Deleted old contacts store');
			}

			// Создаём новый store с правильным keyPath
			const contactsStore = db.createObjectStore('contacts', {
				keyPath: 'compositeKey', // ✅ Составной ключ owner:contactId
			});

			// Добавляем индексы
			contactsStore.createIndex('owner', 'owner', { unique: false });
			contactsStore.createIndex('status', 'status', { unique: false });

			console.log('✅ Created new contacts store with compositeKey');
		}

		// Store для пользователей
		if (!db.objectStoreNames.contains('users')) {
			const usersStore = db.createObjectStore('users', { keyPath: 'username' });
			usersStore.createIndex('createdAt', 'createdAt', { unique: false });
			console.log('✅ Created store: users');
		}

		console.log('📦 All stores ready');
	}

	// === ОСНОВНЫЕ МЕТОДЫ ===

	async get(key, storeName = 'data') {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readonly');
			const store = tx.objectStore(storeName);
			const request = store.get(key);

			request.onsuccess = () => {
				resolve(request.result?.value || null);
			};

			request.onerror = () => {
				reject(new Error(`Failed to get ${key}`));
			};
		});
	}

	async set(key, value, storeName = 'data') {
		return new Promise((resolve, reject) => {
			this.writeQueue.push({ key, value, storeName, resolve, reject });

			if (this.writeQueue.length >= this.maxBatchSize) {
				this.flush();
			} else {
				this.scheduleFlush();
			}
		});
	}

	async delete(key, storeName = 'data') {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readwrite');
			const store = tx.objectStore(storeName);
			const request = store.delete(key);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(new Error(`Failed to delete ${key}`));
		});
	}

	async getAll(storeName = 'data') {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readonly');
			const store = tx.objectStore(storeName);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(new Error('Failed to getAll'));
			};
		});
	}

	// === BATCHING ===

	scheduleFlush() {
		if (this.flushTimer) return;

		this.flushTimer = setTimeout(() => {
			this.flush();
		}, this.flushInterval);
	}

	async flush() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		if (this.writeQueue.length === 0) return;

		const batch = this.writeQueue.splice(0);

		try {
			// Группируем по storeName
			const byStore = {};
			for (const item of batch) {
				if (!byStore[item.storeName]) {
					byStore[item.storeName] = [];
				}
				byStore[item.storeName].push(item);
			}

			// Пишем каждый store в своей транзакции
			for (const [storeName, items] of Object.entries(byStore)) {
				await this.writeBatch(storeName, items);
			}
		} catch (err) {
			console.error('Batch write failed:', err);

			// Пытаемся записать по одному
			for (const item of batch) {
				try {
					await this.writeSingle(item.storeName, item.key, item.value);
					item.resolve();
				} catch (e) {
					item.reject(e);
				}
			}
		}
	}

	async writeBatch(storeName, items) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readwrite');
			const store = tx.objectStore(storeName);

			const promises = items.map(
				({ key, value, resolve: itemResolve, reject: itemReject }) => {
					return new Promise((res, rej) => {
						const request = store.put({ key, value });
						request.onsuccess = () => {
							itemResolve();
							res();
						};
						request.onerror = () => {
							itemReject(request.error);
							rej(request.error);
						};
					});
				}
			);

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);

			// Запускаем все операции
			Promise.all(promises).catch(reject);
		});
	}

	async writeSingle(storeName, key, value) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readwrite');
			const store = tx.objectStore(storeName);
			const request = store.put({ key, value });

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// === СПЕЦИАЛЬНЫЕ МЕТОДЫ ===

	// Сохранить сообщение
	async saveMessage(message) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['messages'], 'readwrite');
			const store = tx.objectStore('messages');
			const request = store.add(message);

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	// Получить сообщения для контакта
	async getMessages(contactId, limit = 50) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['messages'], 'readonly');
			const store = tx.objectStore('messages');
			const index = store.index('contactId');
			const request = index.getAll(contactId);

			request.onsuccess = () => {
				const messages = request.result;
				// Сортируем по timestamp и берём последние
				messages.sort((a, b) => b.timestamp - a.timestamp);
				resolve(messages.slice(0, limit));
			};

			request.onerror = () => reject(request.error);
		});
	}

	// Сохранить контакт
	async saveContact(contact) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['contacts'], 'readwrite');
			const store = tx.objectStore('contacts');
			const request = store.put(contact);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// Получить все контакты
	async getContacts() {
		return this.getAll('contacts');
	}

	// === CLEANUP ===

	async close() {
		// Flush pending writes
		await this.flush();

		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	async clear(storeName = 'data') {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], 'readwrite');
			const store = tx.objectStore(storeName);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clearAll() {
		await this.clear('data');
		await this.clear('messages');
		await this.clear('contacts');
	}

	async getUser(username) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['users'], 'readonly');
			const store = tx.objectStore('users');
			const request = store.get(username);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async saveUser(user) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['users'], 'readwrite');
			const store = tx.objectStore('users');
			const request = store.put(user);

			// Ждем завершения всей транзакции, а не только запроса
			tx.oncomplete = () => {
				console.log('💾 Transaction commited for user:', user.username);
				resolve();
			};

			tx.onerror = () => reject(tx.error);
			request.onerror = () => reject(request.error);
		});
	}

	async deleteUser(username) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['users'], 'readwrite');
			const store = tx.objectStore('users');
			const request = store.delete(username);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getAllUsers() {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(['users'], 'readonly');
			const store = tx.objectStore('users');
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async userExists(username) {
		const user = await this.getUser(username);
		return user !== null;
	}
}
