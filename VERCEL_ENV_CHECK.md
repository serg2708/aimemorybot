# Проверка Environment Variables на Vercel

## 🔍 ПОЧЕМУ ПОДПИСКИ В MOCK MODE?

Подписки используют mock mode, если:
1. ✅ `NEXT_PUBLIC_MOCK_SUBSCRIPTION === "true"` (явно включён)
2. ✅ Contract address НЕ настроен для текущей сети
3. ✅ Contract address пустой (`""`)

## 📋 ЧТО ПРОВЕРИТЬ НА VERCEL:

### Шаг 1: Откройте настройки Vercel

1. Зайдите на https://vercel.com
2. Откройте ваш проект `aimemorybot`
3. Перейдите в **Settings** → **Environment Variables**

### Шаг 2: Проверьте эти переменные

#### ✅ ОБЯЗАТЕЛЬНЫЕ:

```bash
# Сеть (testnet или mainnet)
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet

# Адрес контракта подписки
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=af132f0080f22baad285c00dbb54213a

# Адрес получателя платежей
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xe83E89fa643Dc19c32E71A47598869701df21091
```

#### ⚠️ НЕ ДОЛЖНО БЫТЬ:

```bash
# Эта переменная НЕ должна быть установлена (или должна быть false)
NEXT_PUBLIC_MOCK_SUBSCRIPTION=true  # ← УДАЛИТЕ ЭТУ!
```

### Шаг 3: Проверьте Chain ID

**Ваш контракт задеплоен на:**
- Network: Chronos Testnet
- Chain ID: **8700**
- Contract: `0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9`

**Убедитесь что:**
```bash
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet  # ← Должно быть testnet!
```

Если установлено `mainnet`, то код будет искать контракт на Chain ID **870**, а ваш контракт на **8700**!

### Шаг 4: После изменений

1. **Сохраните** изменения в Vercel
2. **Redeploy** проект:
   - Settings → Deployments → три точки → Redeploy
   - ИЛИ сделайте новый commit и push

---

## 🧪 КАК ПРОВЕРИТЬ ЧТО РАБОТАЕТ:

### Способ 1: Console в браузере

Откройте ваш сайт на Vercel и в консоли (F12) выполните:

```javascript
console.log('Network:', process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK)
console.log('Contract:', process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM)
console.log('Mock Mode:', process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION)
```

**Должно быть:**
```
Network: testnet
Contract: 0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9
Mock Mode: undefined (или false)
```

### Способ 2: Network Status Component

На странице `/pricing` внизу должен быть debug panel (если есть):
- ✅ Contract Address: `0xB6883...`
- ✅ Network: Chronos Testnet (8700)
- ❌ Mock Mode: НЕ должно быть warning

---

## 🚨 ЧАСТЫЕ ОШИБКИ:

### ❌ Ошибка 1: `NEXT_PUBLIC_MOCK_SUBSCRIPTION=true`
**Решение:** Удалите эту переменную из Vercel Settings

### ❌ Ошибка 2: `NEXT_PUBLIC_AUTONOMYS_NETWORK=mainnet`
**Решение:** Измените на `testnet` (ваш контракт на testnet!)

### ❌ Ошибка 3: Contract address не указан
**Решение:** Добавьте `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9`

### ❌ Ошибка 4: Забыли Redeploy
**Решение:** После изменения env переменных всегда делайте Redeploy!

---

## ✅ ПРАВИЛЬНАЯ КОНФИГУРАЦИЯ:

```bash
# ===== Autonomys Network =====
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet
NEXT_PUBLIC_AUTONOMYS_RPC_URL=wss://rpc-chronos.autonomys.xyz
NEXT_PUBLIC_AUTONOMYS_CHAIN_ID=490000

# ===== Smart Contracts =====
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9

# ===== Wallet =====
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=af132f0080f22baad285c00dbb54213a
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xe83E89fa643Dc19c32E71A47598869701df21091

# ===== AutoDrive API =====
NEXT_PUBLIC_AUTONOMYS_API_KEY=93c862396e8e43c9bbfb148e7203aea5

# ===== НЕ ДОЛЖНО БЫТЬ =====
# NEXT_PUBLIC_MOCK_SUBSCRIPTION=true  # ← НЕ добавляйте эту строку!
```

---

## 🔧 КАК ИСПРАВИТЬ:

1. Зайдите в Vercel Settings → Environment Variables
2. Проверьте/добавьте все переменные выше
3. Убедитесь что `NEXT_PUBLIC_MOCK_SUBSCRIPTION` НЕ установлена
4. Убедитесь что `NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet`
5. Сохраните изменения
6. Redeploy проект
7. Откройте `/pricing` и проверьте - должно появиться окно MetaMask!

---

**После этих изменений подписки должны работать через реальный смарт-контракт!** 🎉
