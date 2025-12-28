# 🚀 VERCEL REDEPLOY - СДЕЛАЙТЕ ЭТО ПРЯМО СЕЙЧАС

## ❌ ПРОБЛЕМА:

```
Uncaught ReferenceError: process is not defined
```

**Причина:** Environment variables добавлены в Vercel, но **НЕ применены** к билду!

---

## ✅ РЕШЕНИЕ: REDEPLOY

### Шаг 1: Откройте Vercel Dashboard

Зайдите на: https://vercel.com/0xfbis-projects/aimemorybot

### Шаг 2: Перейдите на вкладку "Deployments"

В верхнем меню найдите вкладку **Deployments** (Деплойменты)

### Шаг 3: Найдите последний деплой

Это самый верхний деплой в списке. Он должен быть помечен как:
- ✅ **Ready** (зелёная галочка)
- **Production** или **Preview**
- Время: несколько минут/часов назад

### Шаг 4: Нажмите на три точки "..."

Справа от деплоя будет кнопка с тремя точками **"..."**

Нажмите на неё.

### Шаг 5: Выберите "Redeploy"

В выпадающем меню выберите **"Redeploy"**

### Шаг 6: Подтвердите Redeploy

Появится модальное окно с вопросом:

```
Redeploy to Production?
This will create a new deployment with the same source code and build settings.
```

**Нажмите кнопку "Redeploy"** (обычно синяя кнопка)

### Шаг 7: Дождитесь завершения

Начнётся процесс билда. Вы увидите:

1. **Building** (Строится) - ~1-2 минуты
2. **Deploying** (Деплоится) - ~10-30 секунд
3. **Ready** ✅ (Готово)

**Не закрывайте вкладку!** Подождите пока статус не станет "Ready"

---

## 🧪 ПРОВЕРКА ПОСЛЕ REDEPLOY:

### 1. Откройте ваш сайт

**Production URL:**
```
https://aimemorybot.vercel.app
```

### 2. Откройте консоль браузера

Нажмите **F12** → вкладка **Console**

### 3. Проверьте лог

Должен быть лог от компонента:

```
[SubscriptionCard] State: {
  address: "0x...",
  subscription: {...},
  isActive: true/false,
  daysLeft: ...,
  isLoading: false,
  error: null
}
```

**Если видите:**
- ✅ `subscription: {...}` с данными - **РАБОТАЕТ!**
- ❌ `process is not defined` - Redeploy не помог, идём дальше

### 4. Проверьте страницу Dashboard

Перейдите на `/dashboard`

**Должны увидеть:**
- Subscription Status с информацией о плане (Free/Basic/Pro)
- НЕ должно быть серых loading блоков

---

## 🔧 ЕСЛИ ПОСЛЕ REDEPLOY ВСЁ ЕЩЁ НЕ РАБОТАЕТ:

### Проблема 1: Переменные только для Production

**Какой URL вы открываете?**

- `https://aimemorybot.vercel.app` - **Production** ✅
- `https://aimemorybot-git-main-*.vercel.app` - **Preview** ⚠️

**Если открыт Preview URL:**

1. Vercel → Settings → Environment Variables
2. Найдите `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM`
3. Нажмите **"..."** → **Edit**
4. Поставьте галочки:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Save
6. Повторите для `NEXT_PUBLIC_PAYMENT_RECIPIENT`
7. **Redeploy** снова

### Проблема 2: Опечатка в имени переменной

В Vercel Settings → Environment Variables проверьте **ТОЧНОЕ** совпадение:

```bash
# ✅ ПРАВИЛЬНО:
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM

# ❌ НЕПРАВИЛЬНО (примеры):
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM_  # лишний _
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM   # лишний пробел
NEXT_PUBLIC_SUBSCRIPTIОN_CONTRACT_AUTO_EVM  # О вместо O
```

**Скопируйте имена из .env.local:**

```bash
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xe83E89fa643Dc19c32E71A47598869701df21091
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=af132f0080f22baad285c00dbb54213a
NEXT_PUBLIC_AUTONOMYS_API_KEY=93c862396e8e43c9bbfb148e7203aea5
```

---

## 📋 CHECKLIST:

- [ ] Открыл Vercel Dashboard
- [ ] Перешёл на вкладку Deployments
- [ ] Нажал "..." на последнем деплое
- [ ] Выбрал "Redeploy"
- [ ] Подтвердил в модальном окне
- [ ] Дождался "Ready" статуса (~2 минуты)
- [ ] Открыл сайт в браузере
- [ ] Проверил консоль (F12)
- [ ] Увидел `[SubscriptionCard] State:` лог без ошибок
- [ ] Subscription Status на Dashboard показывает данные (не loading)

---

## 🎯 АЛЬТЕРНАТИВНЫЙ СПОСОБ (через Git):

Если вы хотите сделать Redeploy через Git:

```bash
cd /home/ser/Downloads/aimemorybot
git add .
git commit --allow-empty -m "chore: Trigger Vercel redeploy with env variables"
git push origin main
```

Это автоматически создаст новый деплой на Vercel.

---

## 📸 ПОСЛЕ REDEPLOY ПОКАЖИТЕ:

1. Screenshot консоли браузера (F12)
2. Screenshot страницы Dashboard
3. Screenshot Vercel Deployments (статус последнего деплоя)

**Это поможет понять, сработало ли!** 🚀
