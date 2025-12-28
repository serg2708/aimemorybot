# Vercel: Environments vs Environment Variables

## 📊 РАЗНИЦА МЕЖДУ ENVIRONMENTS И ENVIRONMENT VARIABLES

---

## 1️⃣ **ENVIRONMENTS** (Окружения)

### Что это?
**Environments** - это отдельные "копии" вашего приложения для разных целей.

### Типы Environments на Vercel:

#### 🟢 **Production** (Продакшн)
- **Назначение**: Основной сайт для пользователей
- **URL**: `https://aimemorybot.vercel.app` (ваш основной домен)
- **Git Branch**: обычно `main` или `master`
- **Когда деплоится**: При push в main branch
- **Для кого**: Реальные пользователи

#### 🟡 **Preview** (Превью)
- **Назначение**: Тестирование фич перед релизом
- **URL**: `https://aimemorybot-git-feature-branch.vercel.app`
- **Git Branch**: любая ветка кроме main (например, `feature/new-design`)
- **Когда деплоится**: При создании Pull Request или push в другую ветку
- **Для кого**: Разработчики, тестировщики

#### 🔵 **Development** (Разработка)
- **Назначение**: Локальная разработка
- **URL**: `http://localhost:3000`
- **Git Branch**: любая локальная ветка
- **Когда деплоится**: Запуск `vercel dev` локально
- **Для кого**: Только вы на своём компьютере

---

## 2️⃣ **ENVIRONMENT VARIABLES** (Переменные окружения)

### Что это?
**Environment Variables** - это секреты и настройки, которые используются в коде.

### Примеры:
```bash
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3...
DATABASE_URL=postgresql://...
API_KEY=secret123
```

---

## 🎯 КАК ОНИ СВЯЗАНЫ?

Environment Variables можно настроить **для каждого Environment** отдельно!

### Пример:

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Реальная БД | Тестовая БД | Локальная БД |
| `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM` | Mainnet контракт | Testnet контракт | Testnet контракт |
| `STRIPE_SECRET_KEY` | Реальный ключ | Тестовый ключ | Тестовый ключ |

---

## 🔐 ПРАВА ДОСТУПА ENVIRONMENT VARIABLES

### Когда создаёте переменную, выбираете для каких environments она доступна:

#### ✅ **All Environments** (Все окружения)
- Переменная доступна в Production, Preview, Development
- **Когда использовать**:
  - Публичные настройки (например, `NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet`)
  - Одинаковые для всех окружений (например, WalletConnect Project ID)

#### ✅ **Production Only** (Только Production)
- Переменная доступна **только** в production
- **Когда использовать**:
  - Реальные секреты (production database password)
  - Mainnet контракты
  - Платёжные ключи (Stripe production keys)

#### ✅ **Preview Only** (Только Preview)
- Переменная доступна **только** в preview deployments
- **Когда использовать**:
  - Тестовые API ключи
  - Staging database URLs

#### ✅ **Development Only** (Только Development)
- Переменная доступна **только** локально (`vercel dev`)
- **Когда использовать**:
  - Локальные настройки
  - Моки API ключей для разработки

---

## 📝 ВАШ СЛУЧАЙ:

На скриншотах я вижу:

### Переменные с "All Environments":
```
NEXT_PUBLIC_AUTONOMYS_API_KEY - All Environments ✅
NEXT_PUBLIC_AUTONOMYS_NETWORK - All Environments ✅
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - All Environments ✅
```

### Переменные с "Production":
```
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM - Production ✅
NEXT_PUBLIC_PAYMENT_RECIPIENT - Production ✅
```

---

## ⚠️ ВАЖНО: ПРАВА ДОСТУПА

### Какие права должны быть?

#### 🟢 **Для NEXT_PUBLIC_* переменных** (публичные):

**Эти переменные видны в браузере** (в JavaScript коде)!

```bash
# Эти переменные БЕЗОПАСНЫ для "All Environments"
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM - All Environments ✅
NEXT_PUBLIC_PAYMENT_RECIPIENT - All Environments ✅
NEXT_PUBLIC_AUTONOMYS_NETWORK - All Environments ✅
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID - All Environments ✅
NEXT_PUBLIC_AUTONOMYS_API_KEY - All Environments ✅
```

**Почему безопасно?**
- Адреса контрактов - публичные (любой может посмотреть в blockchain explorer)
- Network настройки - не секрет
- WalletConnect Project ID - предназначен для публичного использования
- Autonomys API Key - бесплатный, с лимитами (не критично если утечёт)

#### 🔴 **Для секретных переменных** (приватные):

**Эти переменные НЕ должны быть в браузере!**

```bash
# Эти переменные ТОЛЬКО для сервера
DATABASE_URL - Production Only ⚠️
POSTGRES_PASSWORD - Production Only ⚠️
AUTH_SECRET - Production Only ⚠️
STRIPE_SECRET_KEY - Production Only ⚠️
OPENAI_API_KEY - Production Only ⚠️
```

**Никогда не добавляйте NEXT_PUBLIC_ к секретам!**

---

## 🎯 РЕКОМЕНДАЦИИ ДЛЯ ВАШЕГО ПРОЕКТА:

### Вариант 1: Всё на Testnet (Рекомендую для начала)

```bash
# All Environments (одинаково везде)
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xe83E89fa643Dc19c32E71A47598869701df21091
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=af132f0080f22baad285c00dbb54213a
NEXT_PUBLIC_AUTONOMYS_API_KEY=93c862396e8e43c9bbfb148e7203aea5
```

**Плюсы:**
- ✅ Одинаково работает в production и preview
- ✅ Не можете случайно потратить реальные деньги
- ✅ Проще для тестирования

**Минусы:**
- ⚠️ Пользователи не могут платить реальными AI3

---

### Вариант 2: Production на Mainnet, Preview на Testnet (Для готового продукта)

#### Production:
```bash
NEXT_PUBLIC_AUTONOMYS_NETWORK=mainnet
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xMainnetContractAddress
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xYourMainWallet
```

#### Preview:
```bash
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xB6883ac3D2dEad2dc55Ac9CC40F39f2768B64dd9
NEXT_PUBLIC_PAYMENT_RECIPIENT=0xe83E89fa643Dc19c32E71A47598869701df21091
```

**Плюсы:**
- ✅ Production работает с реальными деньгами
- ✅ Preview безопасен для тестирования

**Минусы:**
- ⚠️ Нужно деплоить контракт на mainnet
- ⚠️ Больше настроек

---

## 🔍 КАК ПРОВЕРИТЬ ПРАВА ДОСТУПА:

### В Vercel UI:

1. Settings → Environment Variables
2. Каждая переменная показывает:
   - 🟢 **All Environments** - зелёная галочка на всех трёх
   - 🟡 **Production** - галочка только на Production
   - 🔵 **Preview** - галочка только на Preview
   - 🟣 **Development** - галочка только на Development

### На вашем скриншоте:

```
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM
  Production ✅ (Added 3m ago)

NEXT_PUBLIC_PAYMENT_RECIPIENT
  Production ✅ (Added 3m ago)

NEXT_PUBLIC_AUTONOMYS_API_KEY
  All Environments ✅ (Added Nov 12)
```

**Проблема:**
Если контракт и recipient только в Production, то в Preview они будут undefined!

---

## ✅ ЧТО СДЕЛАТЬ СЕЙЧАС:

### Рекомендую изменить права на "All Environments":

1. В Vercel Settings → Environment Variables
2. Нажмите **"..."** на переменной `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM`
3. Выберите **"Edit"**
4. Поставьте галочки на **Production**, **Preview**, **Development**
5. Нажмите **"Save"**
6. Повторите для `NEXT_PUBLIC_PAYMENT_RECIPIENT`
7. **Redeploy** проект

**Зачем?**
- Тестировать можно будет не только в production
- Preview deployments тоже будут работать с контрактом
- Меньше путаницы

---

## 📚 ИТОГ:

| Термин | Что это | Пример |
|--------|---------|--------|
| **Environment** | Копия приложения | Production, Preview, Development |
| **Environment Variable** | Секрет/настройка | `DATABASE_URL=...` |
| **All Environments** | Переменная доступна везде | Публичные настройки |
| **Production Only** | Переменная только в production | Реальные секреты |

**Для NEXT_PUBLIC_ переменных безопасно ставить "All Environments"** ✅

**Для DATABASE_URL, API_KEYS ставьте "Production Only"** ⚠️

---

**Хотите, чтобы я помог изменить права доступа переменных?** 🚀
