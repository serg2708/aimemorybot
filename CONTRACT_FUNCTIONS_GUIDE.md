# 📚 Руководство по функциям SubscriptionSecure

## 🎯 Обзор контракта

**Контракт:** `SubscriptionSecure`
**Файл:** `contracts/Subscription.secure.sol`
**Версия Solidity:** ^0.8.30
**Наследование:** Ownable2Step, ReentrancyGuard, Pausable

---

## 📋 Все функции контракта (13 функций)

### 🟦 PUBLIC/EXTERNAL FUNCTIONS (пользовательские)

#### 1. `subscribe()` - Покупка подписки

```solidity
function subscribe(Plan _plan, uint256 _duration) external payable
```

**Описание:** Основная функция для покупки новой подписки или продления существующей.

**Параметры:**
- `_plan` - План подписки (1=BASIC, 2=PRO, 3=UNLIMITED)
- `_duration` - Длительность в секундах (например, 30 дней = 2592000)

**Требования:**
- ✅ Контракт не на паузе (`whenNotPaused`)
- ✅ Не может быть вызван повторно во время выполнения (`nonReentrant`)
- ✅ План не может быть FREE (FREE - бесплатный, без оплаты)
- ✅ Duration > 0
- ✅ msg.value > 0 (нужна оплата в tAI3/AI3)
- ✅ Прошёл 1 час с последней подписки (rate limiting)

**Что делает:**
1. Проверяет входные данные
2. Проверяет rate limit (1 час между подписками)
3. Рассчитывает время истечения:
   - Если есть активная подписка → продлевает её
   - Если нет → создаёт новую с текущего времени
4. Обновляет состояние подписки
5. Сохраняет платёж в `pendingWithdrawal` (Pull Payment Pattern)
6. Эмитирует события

**События:**
- `Subscribed(user, plan, duration, expiresAt, amount)`
- `PaymentReceived(from, amount)`

**Пример использования:**
```javascript
// Купить BASIC подписку на 30 дней
await subscription.subscribe(
  1,                    // Plan.BASIC
  30 * 24 * 60 * 60,   // 30 дней в секундах
  { value: ethers.parseEther("0.01") } // 0.01 AI3
);
```

**Безопасность:**
- ✅ ReentrancyGuard - защита от повторного входа
- ✅ Checks-Effects-Interactions - правильный порядок операций
- ✅ Pull Payment - деньги не отправляются сразу owner

---

#### 2. `extendSubscription()` - Продление подписки

```solidity
function extendSubscription(uint256 _duration) external payable
```

**Описание:** Продление существующей активной подписки.

**Параметры:**
- `_duration` - Дополнительная длительность в секундах

**Требования:**
- ✅ Контракт не на паузе
- ✅ NonReentrant
- ✅ Duration > 0
- ✅ msg.value > 0
- ✅ У пользователя есть активная подписка
- ✅ Подписка не FREE
- ✅ Прошёл 1 час с последней операции

**Что делает:**
1. Проверяет наличие активной подписки
2. Проверяет rate limit
3. Добавляет время к существующей подписке
4. Сохраняет платёж
5. Эмитирует события

**Разница с subscribe():**
- `subscribe()` - может создать новую или продлить существующую
- `extendSubscription()` - только продление, требует активную подписку

**События:**
- `SubscriptionExtended(user, duration, newExpiresAt, amount)`
- `PaymentReceived(from, amount)`

**Пример:**
```javascript
// Продлить подписку на 7 дней
await subscription.extendSubscription(
  7 * 24 * 60 * 60,   // 7 дней
  { value: ethers.parseEther("0.005") }
);
```

---

#### 3. `cancelSubscription()` - Отмена подписки

```solidity
function cancelSubscription() external
```

**Описание:** Отменяет активную подписку (останавливает авто-продление, не возвращает деньги).

**Параметры:** Нет

**Требования:**
- ✅ У пользователя есть активная подписка

**Что делает:**
1. Устанавливает `isActive = false`
2. Подписка продолжит работать до `expiresAt`
3. После истечения вернётся к FREE плану

**События:**
- `SubscriptionCancelled(user)`

**Пример:**
```javascript
// Отменить подписку
await subscription.cancelSubscription();

// Подписка будет работать до окончания оплаченного периода
// После истечения автоматически станет FREE
```

**Важно:** Отмена НЕ возвращает деньги! Подписка работает до конца оплаченного периода.

---

#### 4. `getSubscription()` - Получить данные подписки

```solidity
function getSubscription(address _user) external view returns (
    Plan plan,
    uint256 expiresAt,
    bool isActive
)
```

**Описание:** Возвращает информацию о подписке пользователя.

**Параметры:**
- `_user` - Адрес пользователя

**Возвращает:**
- `plan` - Текущий план (0=FREE, 1=BASIC, 2=PRO, 3=UNLIMITED)
- `expiresAt` - Timestamp истечения
- `isActive` - Активна ли подписка

**Особенность:**
- Автоматически проверяет истечение
- Если подписка истекла → возвращает `(Plan.FREE, 0, false)`

**Пример:**
```javascript
const [plan, expiresAt, isActive] = await subscription.getSubscription(userAddress);

console.log("Plan:", plan);           // 1 (BASIC)
console.log("Expires:", expiresAt);   // 1735689600
console.log("Active:", isActive);     // true

// Перевести timestamp в дату
const date = new Date(Number(expiresAt) * 1000);
console.log("Expires on:", date.toLocaleDateString());
```

---

#### 5. `isSubscriptionActive()` - Проверка активности

```solidity
function isSubscriptionActive(address _user) external view returns (bool)
```

**Описание:** Быстрая проверка - активна ли подписка у пользователя.

**Параметры:**
- `_user` - Адрес пользователя

**Возвращает:**
- `true` - подписка активна и не истекла
- `false` - нет подписки или истекла

**Пример:**
```javascript
const isActive = await subscription.isSubscriptionActive(userAddress);

if (isActive) {
  console.log("✅ Подписка активна");
} else {
  console.log("❌ Подписка неактивна или истекла");
}
```

---

#### 6. `getPendingWithdrawal()` - Сумма для вывода

```solidity
function getPendingWithdrawal() external view returns (uint256)
```

**Описание:** Возвращает сумму накопленных платежей, доступных для вывода owner.

**Параметры:** Нет

**Возвращает:**
- Сумма в wei (1 AI3 = 10^18 wei)

**Пример:**
```javascript
const pending = await subscription.getPendingWithdrawal();
console.log("Pending:", ethers.formatEther(pending), "AI3");

// Output: Pending: 2.5 AI3
```

**Использование:**
- Owner может проверить сколько накопилось
- Пользователи могут видеть сколько было собрано

---

#### 7. `getRateLimitStatus()` - Статус rate limit

```solidity
function getRateLimitStatus(address _user) external view returns (
    bool canSubscribe,
    uint256 timeUntilNext
)
```

**Описание:** Проверяет может ли пользователь купить/продлить подписку (rate limiting = 1 час).

**Параметры:**
- `_user` - Адрес пользователя

**Возвращает:**
- `canSubscribe` - Может ли подписаться сейчас
- `timeUntilNext` - Секунд до сброса rate limit

**Пример:**
```javascript
const [canSubscribe, timeUntilNext] = await subscription.getRateLimitStatus(userAddress);

if (canSubscribe) {
  console.log("✅ Можно подписаться");
} else {
  const minutes = Math.ceil(timeUntilNext / 60);
  console.log(`⏳ Подождите ${minutes} минут`);
}
```

**UI Integration:**
```jsx
const [canSubscribe, timeLeft] = await getRateLimitStatus(address);

<button disabled={!canSubscribe}>
  {canSubscribe
    ? "Купить подписку"
    : `Подождите ${Math.ceil(timeLeft/60)} мин`}
</button>
```

---

### 🔐 OWNER-ONLY FUNCTIONS (только владелец)

#### 8. `withdrawFunds()` - Вывод средств

```solidity
function withdrawFunds() external onlyOwner nonReentrant
```

**Описание:** Owner выводит накопленные платежи (Pull Payment Pattern).

**Параметры:** Нет

**Требования:**
- ✅ Только owner может вызвать
- ✅ NonReentrant
- ✅ pendingWithdrawal > 0

**Что делает:**
1. Проверяет что есть средства для вывода
2. Обнуляет `pendingWithdrawal` (защита от reentrancy)
3. Переводит средства на адрес owner
4. Эмитирует событие

**События:**
- `FundsWithdrawn(to, amount)`

**Пример:**
```javascript
// Owner вызывает
await subscription.withdrawFunds();

// Все накопленные платежи переводятся owner
```

**Безопасность:**
- ✅ Checks-Effects-Interactions - обнуляет перед переводом
- ✅ Pull Payment - owner сам забирает деньги
- ✅ Не может быть DoS атака (owner контролирует когда выводить)

---

#### 9. `emergencyWithdraw()` - Аварийный вывод

```solidity
function emergencyWithdraw() external onlyOwner whenPaused
```

**Описание:** Аварийный вывод ВСЕХ средств из контракта (только когда контракт на паузе).

**Параметры:** Нет

**Требования:**
- ✅ Только owner
- ✅ Контракт должен быть на паузе (`whenPaused`)
- ✅ Баланс контракта > 0

**Что делает:**
1. Получает весь баланс контракта
2. Обнуляет `pendingWithdrawal`
3. Переводит ВСЁ на адрес owner

**Когда использовать:**
- 🚨 Обнаружена критическая уязвимость
- 🚨 Нужна срочная миграция на новый контракт
- 🚨 Emergency situation

**Пример:**
```javascript
// 1. Сначала паузим контракт
await subscription.pause();

// 2. Теперь можем вывести все средства
await subscription.emergencyWithdraw();

// Все средства переведены owner
// Пользователи не могут больше ничего делать (контракт на паузе)
```

**Важно:** Используется только в критических ситуациях!

---

#### 10. `pause()` - Остановка контракта

```solidity
function pause() external onlyOwner
```

**Описание:** Ставит контракт на паузу (emergency stop).

**Параметры:** Нет

**Требования:**
- ✅ Только owner

**Что делает:**
- Останавливает функции с модификатором `whenNotPaused`
- `subscribe()` и `extendSubscription()` перестают работать
- `cancelSubscription()` и view функции продолжают работать

**Пример:**
```javascript
// Остановить контракт
await subscription.pause();

// Теперь:
// ❌ subscribe() - revert
// ❌ extendSubscription() - revert
// ✅ cancelSubscription() - работает
// ✅ getSubscription() - работает
```

**Когда использовать:**
- 🚨 Обнаружен баг
- 🚨 Атака в процессе
- 🚨 Нужно время на fix

---

#### 11. `unpause()` - Возобновление работы

```solidity
function unpause() external onlyOwner
```

**Описание:** Снимает контракт с паузы.

**Параметры:** Нет

**Требования:**
- ✅ Только owner
- ✅ Контракт должен быть на паузе

**Пример:**
```javascript
// После исправления бага
await subscription.unpause();

// Контракт снова работает нормально
```

---

#### 12. `transferOwnership()` - Начало передачи владения

```solidity
function transferOwnership(address newOwner) external onlyOwner
```

**Описание:** Инициирует двухшаговую передачу владения (из Ownable2Step).

**Параметры:**
- `newOwner` - Адрес нового владельца

**Требования:**
- ✅ Только owner
- ✅ newOwner != address(0)

**Что делает:**
- Устанавливает `pendingOwner = newOwner`
- Новый owner должен вызвать `acceptOwnership()`

**Пример:**
```javascript
// Шаг 1: Текущий owner инициирует передачу
await subscription.transferOwnership(newOwnerAddress);

// Контракт ещё принадлежит старому owner!

// Шаг 2: Новый owner должен принять
await subscription.connect(newOwner).acceptOwnership();

// Теперь новый owner - владелец
```

**Безопасность:**
- ✅ Двухшаговый процесс - защита от опечаток
- ✅ Новый owner должен подтвердить

---

#### 13. `acceptOwnership()` - Принятие владения

```solidity
function acceptOwnership() external
```

**Описание:** Новый owner принимает владение контрактом (завершает двухшаговую передачу).

**Параметры:** Нет

**Требования:**
- ✅ msg.sender == pendingOwner

**Пример:**
```javascript
// После того как старый owner вызвал transferOwnership()

// Новый owner принимает
await subscription.connect(newOwner).acceptOwnership();

// Теперь новый owner - полноправный владелец
```

---

### 🎁 SPECIAL FUNCTIONS

#### 14. `receive()` - Приём платежей

```solidity
receive() external payable
```

**Описание:** Fallback функция для прямых переводов ETH/AI3 на контракт.

**Что делает:**
- Принимает любые переводы
- Добавляет к `pendingWithdrawal`
- Эмитирует `PaymentReceived`

**Когда вызывается:**
- Прямой перевод на адрес контракта
- `send()` или `transfer()` на контракт

**Пример:**
```javascript
// Прямой перевод на контракт
await signer.sendTransaction({
  to: contractAddress,
  value: ethers.parseEther("0.1")
});

// Деньги добавятся к pendingWithdrawal
// Owner может вывести через withdrawFunds()
```

---

## 📊 Сводная таблица функций

| Функция | Тип | Модификаторы | Gas | Описание |
|---------|-----|--------------|-----|----------|
| `subscribe()` | External Payable | whenNotPaused, nonReentrant | ~100k | Покупка подписки |
| `extendSubscription()` | External Payable | whenNotPaused, nonReentrant | ~80k | Продление подписки |
| `cancelSubscription()` | External | - | ~30k | Отмена подписки |
| `getSubscription()` | View | - | 0 | Получить данные |
| `isSubscriptionActive()` | View | - | 0 | Проверка активности |
| `getPendingWithdrawal()` | View | - | 0 | Сумма для вывода |
| `getRateLimitStatus()` | View | - | 0 | Статус rate limit |
| `withdrawFunds()` | External | onlyOwner, nonReentrant | ~50k | Вывод средств |
| `emergencyWithdraw()` | External | onlyOwner, whenPaused | ~50k | Аварийный вывод |
| `pause()` | External | onlyOwner | ~30k | Остановка |
| `unpause()` | External | onlyOwner | ~30k | Возобновление |
| `transferOwnership()` | External | onlyOwner | ~30k | Начало передачи |
| `acceptOwnership()` | External | - | ~30k | Принятие владения |
| `receive()` | Payable | - | ~25k | Приём платежей |

---

## 🔒 Модификаторы безопасности

### `whenNotPaused`
- Из Pausable
- Функция работает только когда контракт НЕ на паузе
- Используется: `subscribe()`, `extendSubscription()`

### `nonReentrant`
- Из ReentrancyGuard
- Защита от reentrancy атак
- Используется: `subscribe()`, `extendSubscription()`, `withdrawFunds()`

### `onlyOwner`
- Из Ownable
- Только владелец может вызвать
- Используется: `withdrawFunds()`, `emergencyWithdraw()`, `pause()`, `unpause()`, `transferOwnership()`

### `whenPaused`
- Из Pausable
- Функция работает только когда контракт НА паузе
- Используется: `emergencyWithdraw()`

---

## 📈 Примеры использования

### Пользовательский flow:

```javascript
// 1. Проверить можно ли подписаться (rate limit)
const [canSubscribe, timeLeft] = await subscription.getRateLimitStatus(userAddress);

if (!canSubscribe) {
  alert(`Подождите ${Math.ceil(timeLeft/60)} минут`);
  return;
}

// 2. Купить подписку BASIC на 30 дней
await subscription.subscribe(
  1,                         // Plan.BASIC
  30 * 24 * 60 * 60,        // 30 дней
  { value: ethers.parseEther("0.01") }
);

// 3. Проверить статус
const [plan, expiresAt, isActive] = await subscription.getSubscription(userAddress);
console.log("Plan:", plan, "Expires:", new Date(expiresAt * 1000));

// 4. Через месяц продлить
await subscription.extendSubscription(
  30 * 24 * 60 * 60,
  { value: ethers.parseEther("0.01") }
);

// 5. Отменить подписку (если нужно)
await subscription.cancelSubscription();
```

### Owner flow:

```javascript
// 1. Проверить накопленные средства
const pending = await subscription.getPendingWithdrawal();
console.log("Накоплено:", ethers.formatEther(pending), "AI3");

// 2. Вывести средства
await subscription.withdrawFunds();

// 3. Emergency - если нужно остановить
await subscription.pause();

// 4. После fix - возобновить
await subscription.unpause();

// 5. Передать владение (если нужно)
await subscription.transferOwnership(newOwnerAddress);
// Новый owner должен принять
await subscription.connect(newOwner).acceptOwnership();
```

---

## 🎯 Frontend Integration

### React Hook пример:

```typescript
export function useSubscription() {
  const { address } = useAccount();
  const contract = useContract(SUBSCRIPTION_ADDRESS, ABI);

  const subscribe = async (plan: number, duration: number, value: bigint) => {
    const [canSubscribe] = await contract.getRateLimitStatus(address);
    if (!canSubscribe) throw new Error("Rate limit exceeded");

    return await contract.subscribe(plan, duration, { value });
  };

  const getSubscription = async () => {
    return await contract.getSubscription(address);
  };

  const cancelSubscription = async () => {
    return await contract.cancelSubscription();
  };

  return { subscribe, getSubscription, cancelSubscription };
}
```

---

## 💡 Best Practices

### Для пользователей:

1. **Проверяйте rate limit** перед подпиской
2. **Используйте `subscribe()`** вместо `extendSubscription()` если не уверены
3. **Отмена не возвращает деньги** - подписка работает до конца
4. **Следите за expiresAt** чтобы вовремя продлить

### Для owner:

1. **Регулярно выводите средства** через `withdrawFunds()`
2. **НЕ используйте `emergencyWithdraw()`** без крайней необходимости
3. **Pause только в emergency** - пользователи не смогут подписаться
4. **Используйте multi-sig** для owner адреса в mainnet

---

## ⚠️ Важные замечания

### Rate Limiting:
- **1 час между операциями** subscribe/extend
- Защита от спама
- Проверяйте `getRateLimitStatus()` перед UI

### Pull Payment Pattern:
- Деньги НЕ отправляются сразу owner
- Накапливаются в `pendingWithdrawal`
- Owner выводит через `withdrawFunds()`
- Защита от DoS атак

### Emergency Stop:
- `pause()` останавливает новые подписки
- Существующие подписки продолжают работать
- View функции работают всегда

---

**Полная документация готова! ✅**

Контракт имеет все необходимые функции для безопасной работы подписочной модели! 🚀
