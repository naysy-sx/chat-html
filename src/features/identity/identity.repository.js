// identity.repository.js
export class IdentityRepository {
	constructor(storage) {
		this.storage = storage;
		this.KEY = 'identity';
	}

	async load() {
		return this.storage.get(this.KEY);
	}

	async save(identityBlob) {
		await this.storage.set(this.KEY, identityBlob);
	}

	async clear() {
		await this.storage.remove(this.KEY);
	}
}
