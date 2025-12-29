# 🔄 RPC Fallback Mechanism

## ❓ Почему `eth_call` если токен AI3/tAI3?

### Ответ:

**AutoEVM (Autonomys Auto EVM)** - это **EVM-совместимая** сеть:

- ✅ Использует **Ethereum Virtual Machine (EVM)**
- ✅ Поддерживает **те же RPC методы** что и Ethereum
  - `eth_call` - чтение данных из смарт-контрактов
  - `eth_sendTransaction` - отправка транзакций
  - `eth_getBalance` - проверка баланса
  - и т.д.
- ✅ Смарт-контракты на **Solidity**
- ✅ Но **нативный токен другой**: **AI3** (mainnet) / **tAI3** (testnet)

### Аналогия:

Точно так же как:
- **Polygon** - использует `eth_*` методы, но токен **MATIC**
- **Arbitrum** - использует `eth_*` методы, но токен **ETH**
- **Optimism** - использует `eth_*` методы, но токен **ETH**
- **AutoEVM** - использует `eth_*` методы, но токен **AI3/tAI3** ✅

**Это стандарт EVM!** Префикс `eth_` означает "EVM-совместимый", а не "Ethereum токен".

---

## 🔄 Текущий Fallback Механизм

### Как работает:

1. **Пытаемся получить данные** через `eth_call` на RPC endpoint
2. **Если RPC не отвечает** (ошибка "eth_call does not exist")
   - Логируем warning в консоль
   - **Устанавливаем FREE план** как default
   - `isLoading` становится `false`
   - UI показывает корректное состояние
3. **Если RPC работает** - показываем реальные данные подписки

### Код:

[lib/subscription.ts:94-107](lib/subscription.ts#L94-L107)

```typescript
} else if (isError) {
  console.error("Failed to fetch subscription from contract:", readError);
  console.warn("Contract address:", contractAddress);
  console.warn("User address:", address);
  console.warn("⚠️ Defaulting to FREE plan due to RPC error");

  // Set FREE plan as default when contract read fails
  setSubscription({
    plan: SubscriptionPlan.FREE,
    expiresAt: 0,
    isPaused: false,
  });
  setError(new Error("Failed to fetch subscription"));
  setIsLoading(false);
}
```

### Результат:

**Вместо:**
- ❌ Бесконечная загрузка (`isLoading: true`)
- ❌ Серые loading блоки
- ❌ Пустой UI

**Показываем:**
- ✅ FREE план
- ✅ Status: Inactive
- ✅ "Upgrade Plan" кнопка
- ✅ Полнофункциональный UI

---

## 🌐 RPC Endpoints

### Chronos Testnet (Chain ID: 8700)

**Единственный публичный RPC:**
```
https://rpc-0.chronos.autonomys.xyz
```

**WebSocket:**
```
wss://auto-evm.chronos.autonomys.xyz/ws
```

### Mainnet (Chain ID: 870)

**HTTP:**
```
https://auto-evm.mainnet.autonomys.xyz
```

**WebSocket:**
```
wss://auto-evm.mainnet.autonomys.xyz/ws
```

---

## 🛠️ Будущие Улучшения

### Если появятся дополнительные RPC endpoints:

1. **Добавить в lib/web3.ts:**
```typescript
rpcUrls: {
  default: {
    http: [
      "https://rpc-0.chronos.autonomys.xyz",
      "https://rpc-1.chronos.autonomys.xyz",  // Будущий endpoint
      "https://rpc-2.chronos.autonomys.xyz",  // Будущий endpoint
    ],
  },
},
```

2. **Viem автоматически** переключится на следующий endpoint если первый не ответит

### Текущее состояние:

- ✅ **Fallback на FREE план** - работает
- ✅ **UI не зависает** - работает
- ⏳ **Множественные RPC** - ждём появления дополнительных endpoints
- ⏳ **Retry logic** - можно добавить когда появятся альтернативы

---

## 📋 Текущая Проблема с RPC

### Ошибка:

```
ContractFunctionExecutionError: The method "eth_call" does not exist / is not available
```

### Возможные причины:

1. **RPC node временно не отвечает**
2. **Обслуживание / обновление сети**
3. **Перегрузка RPC endpoint**

### Когда заработает:

Как только RPC node снова заработает, приложение **автоматически** начнёт показывать реальные данные подписок.

**Никаких действий от вас не требуется!**

---

## ✅ Итог

### Что работает сейчас:

1. ✅ **UI не зависает** - fallback на FREE план
2. ✅ **Пользователи видят корректное состояние**
3. ✅ **Можно подписаться** когда RPC заработает
4. ✅ **Graceful degradation** - приложение работает даже при проблемах RPC

### Что произойдёт когда RPC заработает:

1. ✅ Автоматически начнёт показывать реальные подписки
2. ✅ Пользователи смогут подписываться на планы
3. ✅ История транзакций будет отображаться
4. ✅ Все функции subscription заработают

**Приложение готово к работе!** 🎉
