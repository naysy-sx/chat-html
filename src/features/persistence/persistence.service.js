// Persistence Service
class PersistenceService {
	constructor() {
		this.db = null;
		this.dbName = "chat-app";
		this.dbVersion = 1;
	}

	async init() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.dbVersion);

			request.onerror = () => {
				reject(new Error("Failed to open IndexedDB"));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;

				// Создаём хранилища
				if (!db.objectStoreNames.contains("profiles")) {
					db.createObjectStore("profiles", { keyPath: "userId" });
				}
				if (!db.objectStoreNames.contains("messages")) {
					db.createObjectStore("messages", { keyPath: "id" });
				}
				if (!db.objectStoreNames.contains("settings")) {
					db.createObjectStore("settings", { keyPath: "key" });
				}
			};
		});
	}

	async get(storeName, key) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], "readonly");
			const store = tx.objectStore(storeName);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	async set(storeName, value) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], "readwrite");
			const store = tx.objectStore(storeName);
			const request = store.put(value);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async delete(storeName, key) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], "readwrite");
			const store = tx.objectStore(storeName);
			const request = store.delete(key);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getAll(storeName) {
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction([storeName], "readonly");
			const store = tx.objectStore(storeName);
			const request = store.getAll();

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
}

export const persistenceService = new PersistenceService();
