# Диагностика Рендеринга Контактов

## Инструкция для тестирования

### Шаг 1: Очистка браузера

1. Откройте DevTools (F12 или Cmd+Option+I)
2. Нажмите Cmd+Shift+R (Hard refresh на macOS) или Ctrl+Shift+R (на Windows)
3. Откройте DevTools Console табу

### Шаг 2: Логирование по фазам

#### Фаза 1: Загрузка приложения

Вы должны увидеть логи когда приложение загружается. Ищите:

- 🐚 логи из app-shell (компонент root)
- 📊 логи из contacts.machine (state machine)
- 📇 логи из sidebar-panel (UI компонент)

#### Фаза 2: Добавление контакта (CLIENT 1)

1. На первом клиенте введите публичный ключ второго клиента в диалог "Добавить контакт"
2. Нажмите кнопку добавления

**Ожидаемые логи (в порядке):**

```
📊 Contacts loading from service...
📊 Contacts loadContacts - loaded X contacts
📊 assignContacts action: assigning X contacts to context
📇 sidebar-panel: received snapshot with X contacts
📇 sidebar-panel.render() called, _contacts.length: X
```

#### Фаза 3: Проверка второго клиента (CLIENT 2)

1. Посмотрите на второго клиента - контакт должен появиться

**Ожидаемые логи (в порядке):**

```
🔄 CONTACTS_RELOAD_REQUESTED event received
📊 Contacts loading from service...
📊 assignContacts action: assigning X contacts to context
📇 sidebar-panel: received snapshot with X contacts
📇 sidebar-panel.render() called, _contacts.length: X
📇 Rendering incoming contact: xxx
```

---

## Логирование по компонентам

### app-shell.js логи (🐚 префикс)

```javascript
🐚 _connectToContactsActor called, actor: exists
🐚 Setting _contactsActor and subscribing...
🐚 Initial contacts from actor: 1
🐚 snapshot received from contacts actor
🐚 Contacts in snapshot: X
🐚 _renderApp() called, _contactsActor: exists actor-123
```

**Что это означает:**

- `_connectToContactsActor called, actor: exists` - contactsActor успешно передан
- `Initial contacts from actor: X` - машина имеет контакты в контексте
- `snapshot received from contacts actor` - subscription работает и получает обновления

**Если видите:**

- `_connectToContactsActor called, actor: NULL` - contactsActor не был передан
- Нет `snapshot received` логов - subscription не работает

---

### sidebar-panel.js логи (📇 префикс)

```javascript
📇 connectedCallback called
📇 contactsActor available: true
📇 contactsActor changed to: exists
📇 sidebar-panel: re-subscribing...
📇 sidebar-panel: subscribing to contactsActor
📇 sidebar-panel: initial snapshot contacts: X
📇 sidebar-panel: received snapshot with X contacts
📇 sidebar-panel.render() called, _contacts.length: X
📇 sidebar-panel.render() grouped: { incoming: X, outgoing: X, accepted: X }
📇 Rendering incoming contact: abc123
📇 Rendering outgoing contact: def456
📇 Rendering accepted contact: ghi789
```

**Что это означает:**

- `connectedCallback called` - компонент подключился к DOM
- `contactsActor changed to: exists` - компонент получил contactsActor prop
- `re-subscribing...` - компонент подписался на updates
- `received snapshot` - snapshot пришел от machine
- `render() called` - render был вызван с контактами
- `Rendering XXX contact` - контакты рендерятся в UI

**Если видите:**

- `connectedCallback called` но потом ничего - компонент не инициализировался
- Нет `contactsActor changed` логов - prop не пришла
- Нет `received snapshot` логов - subscription не получает обновления
- `render() called` но `_contacts.length: 0` - контакты не дошли до компонента

---

### contacts.machine.js логи (📊 префикс)

```javascript
📊 Contacts loading from service...
📊 Contacts loadContacts - loaded X contacts
📊 assignContacts action: assigning X contacts
📊 Contacts machine entered ready state with X contacts
📊 Contacts ready state entry - final contact count: X
```

**Что это означает:**

- `loadContacts - loaded X contacts` - contacts загрузились из БД
- `assignContacts action` - контакты присвоены в context
- `entered ready state with X contacts` - machine готов с контактами

---

## Тестовый сценарий

### Сценарий 1: Один контакт

1. Откройте две вкладки браузера (CLIENT1 и CLIENT2)
2. Залогинитесь обеими учетными записями
3. На CLIENT1: Добавьте PUBLIC_KEY от CLIENT2
4. Наблюдайте логи
5. На CLIENT2: Проверьте появился ли контакт

### Ожидаемый результат:

- На CLIENT1: Контакт появляется в "Исходящие" секции
- На CLIENT2: Контакт появляется в "Входящие" секции
- В консоли видны все логи из трех фаз

### Если контакты не появляются:

**Проверьте логи в этом порядке:**

1. **Есть ли 🐚 логи?** (app-shell)

   - НЕТ → ContactsActor не передан в sidebar-panel
   - ДА → Переходите на шаг 2

2. **Есть ли 📇 логи от connectedCallback?** (sidebar-panel)

   - НЕТ → sidebar-panel компонент не загрузился
   - ДА → Переходите на шаг 3

3. **Есть ли 📇 логи "contactsActor changed"?** (sidebar-panel)

   - НЕТ → ContactsActor prop не передана
   - ДА → Переходите на шаг 4

4. **Есть ли 📇 логи "received snapshot"?** (sidebar-panel)

   - НЕТ → subscription не получает обновления от машины
   - ДА → Переходите на шаг 5

5. **Есть ли "Rendering XXX contact" логи?** (sidebar-panel)
   - НЕТ → Контакты есть в массиве но не рендерятся
   - ДА → Контакты должны быть видны в UI

---

## Копирование логов

### Как скопировать логи:

1. Откройте DevTools Console
2. Нажмите Ctrl+A чтобы выбрать все
3. Нажмите Ctrl+C чтобы скопировать
4. Вставьте в текстовый файл

### Что нужно предоставить:

1. Логи CLIENT 1 когда добавляете контакт
2. Логи CLIENT 2 сразу после добавления на CLIENT 1
3. Скажите есть ли ошибки в консоли (красные логи)
