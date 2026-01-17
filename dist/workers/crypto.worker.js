// Crypto Worker — реальная криптография на WebCrypto
// public/workers/crypto.worker.js

console.log('[crypto-worker] loaded');

self.postMessage({
	type: 'diagnostic',
	stage: 'worker_loaded',
	cryptoAvailable: !!self.crypto,
	subtleAvailable: !!self.crypto?.subtle,
});

self.onmessage = async (e) => {
	const { requestId, method, params } = e.data;

	console.log('[crypto-worker] → request', e.data);

	try {
		let result;

		switch (method) {
			case 'generateIdentity':
				result = await generateIdentity();
				break;

			case 'encrypt':
				result = await encryptMessage(
					params.plaintext,
					params.recipientExchangePublicKey
				);
				break;

			case 'decrypt':
				result = await decryptMessage(
					params.ciphertext,
					params.iv,
					params.senderEphemeralPublicKey,
					params.myExchangePrivateKey
				);
				break;

			case 'deriveKeyFromPassword':
				result = await deriveKeyFromPassword(
					params.password,
					params.salt,
					params.usage
				);
				break;

			case 'encryptWithPassword':
				result = await encryptWithPassword(
					params.data,
					params.password,
					params.salt
				);
				break;

			case 'decryptWithPassword':
				result = await decryptWithPassword(
					params.encryptedData,
					params.password,
					params.salt
				);
				break;

			default:
				throw new Error(`Unknown method: ${method}`);
		}
		console.log('[crypto-worker] ✓ result', method);
		self.postMessage({ requestId, result });
	} catch (error) {
		console.error('[crypto-worker] ✗ error', error);
		self.postMessage({ requestId, error: error.message });
	}
};

/* ============================================================
   IDENTITY
   ============================================================ */

// Identity = ECDSA (подписи сейчас не используем, но готовы)
async function generateIdentity() {
	console.group('[crypto] generateIdentity');

	const identityKeyPair = await crypto.subtle.generateKey(
		{ name: 'ECDSA', namedCurve: 'P-256' },
		true,
		['sign', 'verify']
	);

	const exchangeKeyPair = await crypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveKey']
	);

	console.log('identityKey type:', identityKeyPair.publicKey.type);
	console.log('exchangeKey type:', exchangeKeyPair.publicKey.type);
	console.log('exchange usages:', exchangeKeyPair.privateKey.usages);

	const identityPublicJwk = await crypto.subtle.exportKey(
		'jwk',
		identityKeyPair.publicKey
	);
	const exchangePublicJwk = await crypto.subtle.exportKey(
		'jwk',
		exchangeKeyPair.publicKey
	);

	console.log('identity curve:', identityPublicJwk.crv);
	console.log('exchange curve:', exchangePublicJwk.crv);

	const userId = await generateUserId(identityPublicJwk);

	console.log('userId length (hex chars):', userId.length); // ДОЛЖНО быть 128
	console.groupEnd();

	return {
		userId,
		identity: {
			publicKey: identityPublicJwk,
			privateKey: await crypto.subtle.exportKey(
				'jwk',
				identityKeyPair.privateKey
			),
		},
		exchange: {
			publicKey: exchangePublicJwk,
			privateKey: await crypto.subtle.exportKey(
				'jwk',
				exchangeKeyPair.privateKey
			),
		},
	};
}

// SHA-512(identityPublicKey) → 512-битный userId
async function generateUserId(identityPublicJwk) {
	const data = new TextEncoder().encode(JSON.stringify(identityPublicJwk));
	const hash = await crypto.subtle.digest('SHA-512', data);
	return bufferToHex(hash); // 128 hex-символов
}

/* ============================================================
   ENCRYPTION
   ============================================================ */

async function encryptMessage(plaintext, recipientExchangePublicJwk) {
	console.group('[crypto] encryptMessage');

	console.log('plaintext length:', plaintext.length);

	const recipientPublicKey = await crypto.subtle.importKey(
		'jwk',
		recipientExchangePublicJwk,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);

	const ephemeralKeyPair = await crypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveKey']
	);

	const aesKey = await crypto.subtle.deriveKey(
		{ name: 'ECDH', public: recipientPublicKey },
		ephemeralKeyPair.privateKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt']
	);

	console.log('AES key type:', aesKey.type);
	console.log('AES key extractable:', aesKey.extractable); // ДОЛЖНО быть false
	console.log('AES key usages:', aesKey.usages);

	const iv = crypto.getRandomValues(new Uint8Array(12));
	console.log('IV length:', iv.length);

	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		aesKey,
		new TextEncoder().encode(plaintext)
	);

	console.log('ciphertext byteLength:', ciphertext.byteLength);

	console.groupEnd();

	return {
		ciphertext: bufferToBase64(ciphertext),
		iv: bufferToBase64(iv),
		ephemeralPublicKey: await crypto.subtle.exportKey(
			'jwk',
			ephemeralKeyPair.publicKey
		),
		algorithm: 'ECDH-P256 + AES-256-GCM',
	};
}

/* ============================================================
   DECRYPTION
   ============================================================ */

async function decryptMessage(
	ciphertextB64,
	ivB64,
	senderEphemeralPublicJwk,
	myExchangePrivateJwk
) {
	const myPrivateKey = await crypto.subtle.importKey(
		'jwk',
		myExchangePrivateJwk,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		['deriveKey']
	);

	const senderPublicKey = await crypto.subtle.importKey(
		'jwk',
		senderEphemeralPublicJwk,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);

	const aesKey = await crypto.subtle.deriveKey(
		{
			name: 'ECDH',
			public: senderPublicKey,
		},
		myPrivateKey,
		{
			name: 'AES-GCM',
			length: 256,
		},
		false,
		['decrypt']
	);

	const plaintextBuffer = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: base64ToBuffer(ivB64),
		},
		aesKey,
		base64ToBuffer(ciphertextB64)
	);

	return new TextDecoder().decode(plaintextBuffer);
}

/* ============================================================
   HELPERS
   ============================================================ */

function bufferToHex(buffer) {
	return [...new Uint8Array(buffer)]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function bufferToBase64(buffer) {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
	return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/* ============================================================
   PASSWORD-BASED KEY DERIVATION (PBKDF2)
   ============================================================ */

/**
 * Вывод ключа из пароля
 * @param {string} password - пароль пользователя
 * @param {string} salt - base64 соль (если null — генерируем новую)
 * @param {string} usage - 'encryption' | 'verification'
 * @returns {{ key: CryptoKey, salt: string, keyHash: string }}
 */
async function deriveKeyFromPassword(
	password,
	saltB64 = null,
	usage = 'encryption'
) {
	console.group('[crypto] deriveKeyFromPassword');

	// Генерируем или декодируем соль
	const salt = saltB64
		? base64ToBuffer(saltB64)
		: crypto.getRandomValues(new Uint8Array(32));

	console.log('salt length:', salt.length);

	// Импортируем пароль как ключ
	const passwordKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveKey', 'deriveBits']
	);

	// Разные параметры для разных целей (защита от атак)
	const iterations = usage === 'verification' ? 100000 : 150000;
	const info = usage === 'verification' ? 'auth-verify' : 'auth-encrypt';

	// Выводим AES ключ
	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode(info).reduce((acc, byte, i) => {
				acc[i % salt.length] ^= byte;
				return acc;
			}, new Uint8Array(salt)),
			iterations,
			hash: 'SHA-256',
		},
		passwordKey,
		{ name: 'AES-GCM', length: 256 },
		true, // extractable для получения хеша
		['encrypt', 'decrypt']
	);

	// Получаем хеш ключа для верификации
	const keyRaw = await crypto.subtle.exportKey('raw', derivedKey);
	const keyHashBuffer = await crypto.subtle.digest('SHA-256', keyRaw);
	const keyHash = bufferToHex(keyHashBuffer);

	console.log('derived key hash:', keyHash.slice(0, 16) + '...');
	console.groupEnd();

	return {
		salt: bufferToBase64(salt),
		keyHash,
		// Ключ не возвращаем напрямую — только через encrypt/decrypt
	};
}

/**
 * Шифрование данных паролем
 */
async function encryptWithPassword(data, password, saltB64) {
	console.group('[crypto] encryptWithPassword');

	const salt = base64ToBuffer(saltB64);

	const passwordKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);

	const aesKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode('auth-encrypt').reduce((acc, byte, i) => {
				acc[i % salt.length] ^= byte;
				return acc;
			}, new Uint8Array(salt)),
			iterations: 150000,
			hash: 'SHA-256',
		},
		passwordKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt']
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const plaintext = new TextEncoder().encode(JSON.stringify(data));

	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		aesKey,
		plaintext
	);

	console.log('encrypted data size:', ciphertext.byteLength);
	console.groupEnd();

	return {
		ciphertext: bufferToBase64(ciphertext),
		iv: bufferToBase64(iv),
	};
}

/**
 * Расшифровка данных паролем
 */
async function decryptWithPassword(encryptedData, password, saltB64) {
	console.group('[crypto] decryptWithPassword');

	const salt = base64ToBuffer(saltB64);

	const passwordKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		'PBKDF2',
		false,
		['deriveKey']
	);

	const aesKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new TextEncoder().encode('auth-encrypt').reduce((acc, byte, i) => {
				acc[i % salt.length] ^= byte;
				return acc;
			}, new Uint8Array(salt)),
			iterations: 150000,
			hash: 'SHA-256',
		},
		passwordKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['decrypt']
	);

	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64ToBuffer(encryptedData.iv) },
		aesKey,
		base64ToBuffer(encryptedData.ciphertext)
	);

	const data = JSON.parse(new TextDecoder().decode(plaintext));

	console.log('decrypted successfully');
	console.groupEnd();

	return data;
}
