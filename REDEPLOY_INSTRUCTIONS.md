# Как сделать Redeploy на Vercel

## 🚀 БЫСТРЫЙ СПОСОБ:

### Вариант 1: Через Vercel UI (Рекомендую)

1. Зайдите на Vercel: https://vercel.com/0xfbis-projects/aimemorybot
2. Перейдите на вкладку **"Deployments"**
3. Найдите последний деплой (самый верхний)
4. Нажмите на три точки **"..."** справа
5. Выберите **"Redeploy"**
6. В модальном окне нажмите **"Redeploy"** ещё раз
7. Дождитесь завершения (обычно 1-2 минуты)

### Вариант 2: Через Git Push

Сделайте пустой commit и push:

```bash
git commit --allow-empty -m "chore: Trigger Vercel redeploy with new env variables"
git push origin main
```

---

## ✅ ПРОВЕРКА ПОСЛЕ REDEPLOY:

1. Откройте ваш сайт на Vercel (например: https://aimemorybot.vercel.app)
2. Перейдите на страницу `/pricing`
3. Подключите кошелек (MetaMask или Talisman)
4. Убедитесь что вы на **Chronos Testnet** (Chain ID 8700)
5. Попробуйте подписаться на любой план

**Ожидаемый результат:**
- ✅ Должно появиться окно кошелька с запросом подписать транзакцию
- ✅ Будет показана стоимость в tAI3
- ✅ После подписания транзакция отправится в блокчейн

**Если всё ещё mock mode:**
- Откройте консоль браузера (F12)
- Проверьте что нет ошибок
- Проверьте Network в консоли

---

## 🔍 DEBUG:

Если после redeploy всё ещё mock mode, добавьте console.log для проверки:

Откройте консоль (F12) и выполните:

```javascript
// Проверить environment variables
console.log('Contract Address:', process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM)
console.log('Network:', process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK)
console.log('Mock Mode Env:', process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION)

// Проверить chainId
console.log('Current Chain ID:', window.ethereum?.chainId)
```

**Должно быть:**
```
Contract Address: 0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9
Network: testnet
Mock Mode Env: undefined
Current Chain ID: 0x21fc (8700 в hex)
```

---

## ⚠️ ВАЖНО:

Environment variables применяются **ТОЛЬКО** после нового билда!

Просто добавить переменные недостаточно - нужен Redeploy!

---

**После Redeploy напишите результат!** 🚀
