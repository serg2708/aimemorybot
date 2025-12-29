# 📊 Subscription Status - Why It Shows "FREE Plan"

## Current Situation

На Dashboard показывается **FREE Plan** вместо реальной подписки из смарт-контракта.

### Почему так происходит?

**Причина:** RPC endpoint `https://rpc-0.chronos.autonomys.xyz` **не поддерживает** метод `eth_call`.

```
Error: The method "eth_call" does not exist / is not available
```

Этот метод необходим для чтения данных из смарт-контрактов. Без него приложение не может:
- ✅ Прочитать вашу текущую подписку
- ✅ Проверить срок действия
- ✅ Узнать статус оплаты

### Это проблема кода?

**Нет!** Это проблема инфраструктуры Autonomys Network:
- Приложение написано правильно
- Код работает корректно
- Проблема в RPC endpoint

---

## Что работает сейчас

### ✅ Полностью функциональное приложение:

1. **Чаты работают нормально**
   - Создание новых чатов
   - Все AI модели доступны
   - Локальное сохранение в браузере

2. **UI корректно отображается**
   - Dashboard загружается
   - Показывает FREE план как fallback
   - Никаких бесконечных загрузок

3. **Wallet подключение**
   - RainbowKit работает
   - Адрес кошелька отображается
   - Network status показывается

4. **Export/Import данных**
   - Экспорт чатов в JSON
   - Импорт из файлов
   - Backup работает

### ⚠️ Не работает из-за RPC:

1. **Чтение подписки из контракта**
   - Невозможно получить текущий план
   - Невозможно проверить срок действия

2. **Отображение баланса**
   - `eth_getBalance` также не поддерживается
   - Показывается "Balance unavailable"

3. **Payment history**
   - Транзакции не отображаются (нужен `eth_call`)

---

## Решение #1: Mock Mode (для тестирования UI)

Если вы хотите **протестировать UI** subscription системы, включите mock режим:

### Как включить Mock Mode:

1. **Локально (.env.local):**
   ```bash
   NEXT_PUBLIC_MOCK_SUBSCRIPTION=true
   ```

2. **На Vercel:**
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_MOCK_SUBSCRIPTION` = `true`
   - Redeploy

### Что даёт Mock Mode:

✅ **Симулирует подписку** без blockchain:
- Можно "купить" любой план (BASIC, PRO, UNLIMITED)
- Данные сохраняются в localStorage
- UI работает как с реальной подпиской

✅ **Тестирование функций:**
- Subscribe button работает
- Extend subscription
- Cancel subscription
- Payment flow

✅ **Просмотр UI:**
- Как выглядит PRO план
- Expiration dates
- Subscription badges
- Payment history (mock данные)

### ⚠️ Важно:

Mock mode это **НЕ реальные** транзакции:
- Токены не списываются
- Blockchain не используется
- Данные только в браузере
- При очистке localStorage - всё пропадёт

---

## Решение #2: Ждать исправления RPC (production)

### Что нужно сделать:

**Связаться с командой Autonomys** и сообщить о проблеме:

**Discord:** https://discord.gg/autonomys
**Telegram:** https://t.me/autonomysnetwork
**Forum:** https://forum.autonomys.xyz

### Сообщение для команды:

```
Hi Autonomys team,

The RPC endpoint https://rpc-0.chronos.autonomys.xyz does not support
standard EVM methods (eth_call, eth_getBalance, eth_chainId).

Error received:
{
  "code": -32601,
  "message": "Method not found"
}

This makes it impossible to read data from smart contracts on Chronos testnet.

Could you please:
1. Fix the RPC endpoint to support standard EVM methods, OR
2. Provide an alternative RPC endpoint with full EVM compatibility

Test case:
curl https://rpc-0.chronos.autonomys.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9","data":"0x0cbebc24"},"latest"],"id":1}'

Result: {"error":{"code":-32601,"message":"Method not found"}}

Thank you!
```

### Когда RPC заработает:

**Автоматически всё заработает!** Не нужно ничего менять в коде:
1. ✅ Subscription status покажет реальные данные
2. ✅ Balance отобразится корректно
3. ✅ Payment history будет читаться из blockchain
4. ✅ Пользователи смогут подписываться на планы

---

## Решение #3: Использовать Mainnet вместо Testnet

**Mainnet RPC может работать лучше:**

### Переключиться на Mainnet:

1. **В .env.local:**
   ```bash
   NEXT_PUBLIC_AUTONOMYS_NETWORK=mainnet
   ```

2. **Redeploy на Vercel**

### ⚠️ Важно:

**Mainnet использует реальные AI3 токены** (не testnet tAI3):
- Нужен реальный баланс AI3
- Транзакции стоят реальных денег
- Для production использования

**Testnet использует бесплатные tAI3:**
- Для разработки и тестирования
- Бесплатные токены
- Но RPC может не работать

---

## FAQ

### Q: Почему FREE план показывается?

**A:** Это fallback механизм. Когда контракт недоступен, приложение показывает FREE план чтобы UI не зависал.

### Q: Пропадут ли мои данные?

**A:** Нет! Чаты сохраняются локально в браузере. Subscription status - это только информация для отображения.

### Q: Могу ли я подписаться сейчас?

**A:** В Mock режиме - да, для тестирования UI.
Реальные подписки - нет, пока RPC не заработает.

### Q: Когда это исправят?

**A:** Зависит от команды Autonomys. Напишите им в Discord/Telegram чтобы ускорить процесс.

### Q: Код написан правильно?

**A:** Да! Код использует стандартные методы:
- `eth_call` - стандарт Ethereum
- `useReadContract` от wagmi
- Viem библиотека

Проблема в RPC endpoint, не в коде.

### Q: Mock mode безопасен?

**A:** Да, но это НЕ реальные транзакции:
- Данные только в localStorage
- Blockchain не используется
- Только для тестирования UI

---

## Техническая информация

### Как работает Fallback:

```typescript
// lib/subscription.ts

if (isError) {
  // RPC failed - use FREE plan as fallback
  console.warn("⚠️ Subscription service unavailable - defaulting to FREE plan");

  setSubscription({
    plan: SubscriptionPlan.FREE,
    expiresAt: 0,
    isActive: false,
  });
  setIsLoading(false);
}
```

### Проверка RPC вручную:

```bash
# Test eth_call support
curl https://rpc-0.chronos.autonomys.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9",
      "data": "0x0cbebc24"
    }, "latest"],
    "id": 1
  }'

# Expected: Smart contract response
# Actual: {"error":{"code":-32601,"message":"Method not found"}}
```

### Что показывает консоль:

**Production (после нашего fix):**
```
⚠️ Subscription service unavailable - RPC endpoint does not support eth_call method. Defaulting to FREE plan.
```

**Development (с деталями):**
```
RPC Error Details: {
  error: "The method \"eth_call\" does not exist / is not available",
  contract: "0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9",
  user: "0x573a3b718328BfF25fd7f5cB1cc5964DfB746CF1"
}
```

---

## Summary

### Текущая ситуация:

- ❌ RPC не поддерживает `eth_call`
- ✅ Приложение работает с fallback на FREE план
- ✅ Все остальные функции работают
- ✅ UI не зависает

### Опции:

1. **Mock Mode** - для тестирования UI (локально)
2. **Подождать fix от Autonomys** - для production
3. **Использовать Mainnet** - если RPC там работает

### Рекомендация:

**Для development:** Включите Mock Mode
**Для production:** Напишите Autonomys team

---

**Last Updated:** 2025-12-29
**Status:** Waiting for RPC fix
**Workaround:** Mock mode available
