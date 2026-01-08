## 📋 КРАТКАЯ ШПАРГАЛКА

### Железные правила

```
1. Фича = папка в features/ с index.js
2. Фичи НЕ знают друг о друге
3. Связь ТОЛЬКО через EventBus
4. Регистрация = featureRegistry.register(feature)
5. Зависимости = dependencies: ['other-feature']
```

### Структура фичи (минимум)

```javascript
// features/X/index.js
export const xFeature = {
  id: 'x',
  name: 'X Feature',
  dependencies: ['a', 'b'], // если нужны
  
  async onMount(context) {
    // создаём актор/сервис
    const actor = spawn(xMachine, { id: 'x' });
    context.actorRegistry.register('x', actor);
    return { actor };
  },
  
  async onUnmount(context) {
    context.actorRegistry.unregister('x');
  },
  
  subscribedEvents: ['EVENT_IN'],
  emittedEvents: ['EVENT_OUT']
};
```

### Core компоненты

```
core/
  event-bus.js       - PriorityEventBus
  feature-registry.js - FeatureRegistry
  actor-registry.js   - ActorRegistry
  app-machine.js      - Root FSM

runtime/
  bootstrap.js        - featureRegistry.register(...)
```

### Коммуникация

```javascript
// Отправить событие
eventBus.dispatch({ type: 'X_HAPPENED' }, 'HIGH');

// Слушать (автоматически через subscribedEvents)
subscribedEvents: ['X_HAPPENED']

// Получить зависимость
const crypto = context.featureRegistry.getMountResult('crypto');
```

### Чеклист фичи

- [ ] Создать features/X/
- [ ] index.js с контрактом
- [ ] machine.js (если нужна логика)
- [ ] service.js (если нужен сервис)
- [ ] ui.js (если нужен UI)
- [ ] Зарегистрировать в bootstrap.js
- [ ] Протестировать изолированно
