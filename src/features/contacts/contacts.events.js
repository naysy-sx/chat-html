/**
 * Events emitted by Contacts feature
 */

export const ContactsEvents = {
	// Инициирующие события (отправляются в машину)
	LOAD_CONTACTS: 'LOAD_CONTACTS',
	ADD_CONTACT: 'ADD_CONTACT',
	REMOVE_CONTACT: 'REMOVE_CONTACT',
	UPDATE_CONTACT: 'UPDATE_CONTACT',
	ACCEPT_CONTACT: 'ACCEPT_CONTACT',
	REJECT_CONTACT: 'REJECT_CONTACT',
	SEARCH_CONTACTS: 'SEARCH_CONTACTS',
	CLEAR_SEARCH: 'CLEAR_SEARCH',

	// События машины (отправляются глобально)
	CONTACTS_LOADED: 'CONTACTS_LOADED',
	CONTACT_ADDED: 'CONTACT_ADDED',
	CONTACT_REMOVED: 'CONTACT_REMOVED',
	CONTACT_UPDATED: 'CONTACT_UPDATED',
	CONTACT_ACCEPTED: 'CONTACT_ACCEPTED',
	CONTACT_REJECTED: 'CONTACT_REJECTED',
	CONTACT_INVITATION_RECEIVED: 'CONTACT_INVITATION_RECEIVED',
	CONTACTS_ERROR: 'CONTACTS_ERROR',
};

/**
 * Структура контакта
 * @typedef {Object} Contact
 * @property {string} id - ID контакта (PublicKey в хешированном виде)
 * @property {string} username - Имя пользователя
 * @property {string} publicKey - Public key контакта
 * @property {string} status - 'pending' | 'accepted' | 'blocked'
 * @property {number} addedAt - Timestamp добавления
 * @property {string} displayName - Отображаемое имя
 * @property {string} avatar - URL аватара (опционально)
 * @property {boolean} isOnline - Статус онлайна
 */

/**
 * Структура события добавления контакта
 * @typedef {Object} AddContactEvent
 * @property {string} type - 'ADD_CONTACT'
 * @property {string} publicKey - Public key нового контакта
 * @property {string} username - Имя пользователя (опционально)
 */

/**
 * Структура события приёма контакта
 * @typedef {Object} AcceptContactEvent
 * @property {string} type - 'ACCEPT_CONTACT'
 * @property {string} contactId - ID контакта
 */
