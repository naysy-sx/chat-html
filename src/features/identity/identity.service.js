// src/features/identity/identity.service.js

export class IdentityCryptoService {
	constructor(workerUrl = '/workers/crypto.worker.js') {
		this.workerUrl = workerUrl;
		this.worker = null;
		this.pending = new Map();
		this.requestId = 0;
	}

	async init() {
		if (this.worker) return;

		this.worker = new Worker(new URL(this.workerUrl, window.location.origin));

		this.worker.onmessage = (e) => {
			const { requestId, result, error } = e.data;
			const entry = this.pending.get(requestId);
			if (!entry) return;

			error ? entry.reject(new Error(error)) : entry.resolve(result);
			this.pending.delete(requestId);
		};

		this.worker.onerror = (err) => {
			console.error('[CryptoService] Worker error:', err);
			for (const { reject } of this.pending.values()) {
				reject(new Error('CryptoWorker crashed'));
			}
			this.pending.clear();
		};
	}

	async request(method, params = {}) {
		await this.init();

		const id = this.requestId++;

		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });

			this.worker.postMessage({
				requestId: id,
				method,
				params,
			});

			setTimeout(() => {
				if (this.pending.has(id)) {
					this.pending.delete(id);
					reject(new Error(`Crypto timeout: ${method}`));
				}
			}, 30_000);
		});
	}

	/* ===== Crypto API ===== */

	generateIdentity() {
		return this.request('generateIdentity');
	}

	encrypt(plaintext, recipientExchangePublicKey) {
		return this.request('encrypt', {
			plaintext,
			recipientExchangePublicKey,
		});
	}

	/**
	 * Расшифровать сообщение
	 * @param {Object} encryptedData - объект от encrypt()
	 * @param {Object} myExchangePrivateKey - приватный ключ (JWK)
	 */
	decrypt(encryptedData, myExchangePrivateKey) {
		// ⭐ Поддерживаем ОБА имени: ephemeralPublicKey и senderEphemeralPublicKey
		const ephemeralKey =
			encryptedData.senderEphemeralPublicKey ||
			encryptedData.ephemeralPublicKey;

		if (!ephemeralKey) {
			return Promise.reject(
				new Error('Missing ephemeral public key in encrypted data')
			);
		}

		if (!myExchangePrivateKey) {
			return Promise.reject(new Error('Missing private key for decryption'));
		}

		return this.request('decrypt', {
			ciphertext: encryptedData.ciphertext,
			iv: encryptedData.iv,
			senderEphemeralPublicKey: ephemeralKey,
			myExchangePrivateKey,
		});
	}

	async destroy() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}
}
