// Crypto Service
class CryptoService {
	constructor() {
		this.keyPair = null;
	}

	async generateKeyPair() {
		try {
			const keyPair = await crypto.subtle.generateKey(
				{
					name: "ECDSA",
					namedCurve: "P-256",
				},
				true,
				["sign", "verify"]
			);

			const publicKey = await crypto.subtle.exportKey(
				"jwk",
				keyPair.publicKey
			);
			const privateKey = await crypto.subtle.exportKey(
				"jwk",
				keyPair.privateKey
			);

			this.keyPair = {
				publicKey: JSON.stringify(publicKey),
				privateKey: JSON.stringify(privateKey),
			};

			return this.keyPair;
		} catch (error) {
			console.error("Failed to generate key pair:", error);
			throw error;
		}
	}

	async encrypt(plaintext, recipientPublicKey) {
		// Упрощённая реализация для минимальной версии
		// В production нужна полная реализация ECDH + AES-GCM
		return btoa(plaintext);
	}

	async decrypt(ciphertext, senderPublicKey) {
		// Упрощённая реализация
		return atob(ciphertext);
	}

	getKeyPair() {
		return this.keyPair;
	}
}

export const cryptoService = new CryptoService();
