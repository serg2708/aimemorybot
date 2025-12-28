# Отладка Environment Variables на Vercel

## ❌ ПРОБЛЕМА: process is not defined

Это означает, что Next.js не заменил `process.env.NEXT_PUBLIC_*` переменные во время билда!

## 🔍 КАК ПРОВЕРИТЬ ENV ПЕРЕМЕННЫЕ В БРАУЗЕРЕ:

### Способ 1: Через View Source (Просмотр исходного кода)

1. Откройте ваш сайт на Vercel
2. Нажмите `Ctrl+U` (View Page Source)
3. Найдите (Ctrl+F) `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT`
4. Если находите строку вида `"0xB6883ac3..."` - переменная загружена ✅
5. Если находите строку вида `process.env.NEXT_PUBLIC...` - НЕ загружена ❌

### Способ 2: Через Network tab

1. Откройте Dev Tools (F12)
2. Перейдите на вкладку Network
3. Перезагрузите страницу
4. Найдите файл `pricing` или `_app-*.js`
5. Посмотрите содержимое - ищите адрес контракта

### Способ 3: Создать debug компонент

Добавьте на страницу:

```tsx
<div className="fixed bottom-4 right-4 bg-black text-white p-4 text-xs">
  <div>Contract: {process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM || 'MISSING'}</div>
  <div>Network: {process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK || 'MISSING'}</div>
</div>
```

---

## ✅ РЕШЕНИЕ:

### Проблема 1: Environment Variables не применились

**Вы добавили переменные НО не сделали Redeploy!**

#### Действия:

1. Зайдите на Vercel Dashboard
2. Перейдите на вкладку **Deployments**
3. Нажмите **"Redeploy"** на последнем деплое
4. Подождите завершения (~2 минуты)
5. Проверьте снова

---

### Проблема 2: Переменные добавлены только для Production

Если вы открываете **Preview URL** (не production URL), а переменные добавлены только для Production environment, они не будут доступны!

#### Решение:

1. Vercel → Settings → Environment Variables
2. Для каждой `NEXT_PUBLIC_*` переменной:
   - Нажмите **"..."** → Edit
   - Поставьте галочки: ✅ Production ✅ Preview ✅ Development
   - Save
3. Redeploy

---

### Проблема 3: Опечатка в имени переменной

Проверьте что имена переменных **точно совпадают**:

В Vercel должно быть:
```
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM
```

В коде используется:
```typescript
process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM
```

**Даже один лишний символ или пробел сломает всё!**

---

## 🧪 ТЕСТ: Правильно ли загружены переменные?

Откройте в браузере (F12 Console):

```javascript
// ❌ НЕ РАБОТАЕТ (process is not defined):
console.log(process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM)

// ✅ ПРАВИЛЬНЫЙ СПОСОБ:
// Просто откройте View Source (Ctrl+U) и найдите строку с CONTRACT
```

---

## 📋 CHECKLIST:

- [ ] Environment Variables добавлены в Vercel Settings
- [ ] Переменные доступны для Production (или того environment где тестируете)
- [ ] **Сделан Redeploy после добавления переменных** ⚠️ **САМОЕ ВАЖНОЕ!**
- [ ] Имена переменных написаны правильно (без опечаток)
- [ ] Переменные начинаются с `NEXT_PUBLIC_` (иначе они не будут в браузере)
- [ ] Открываете правильный URL (production или preview в зависимости от environment)

---

## 🎯 ЧТО ДЕЛАТЬ ПРЯМО СЕЙЧАС:

### 1. Проверьте какой URL вы открываете:

**Production URL:**
```
https://aimemorybot.vercel.app
```

**Preview URL (пример):**
```
https://aimemorybot-git-main-username.vercel.app
```

### 2. Убедитесь что переменные есть для этого environment:

- Если открыт Production → переменные должны быть для Production
- Если открыт Preview → переменные должны быть для Preview

### 3. REDEPLOY:

Это **ОБЯЗАТЕЛЬНЫЙ** шаг! Environment variables применяются только при новом билде!

```
Vercel → Deployments → ... → Redeploy
```

### 4. После Redeploy проверьте:

Откройте страницу → F12 → Console

Должен быть log от `[SubscriptionCard] State:` с данными (не с `process is not defined`)

---

**Какой URL вы открываете? Production или Preview?** 🤔
