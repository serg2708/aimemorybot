# Настройка реальных платежей подписки

## Проблема

Сейчас апгрейд плана происходит **тестово без подписания транзакции в кошельке**, потому что:

1. Smart contract для подписок **не задеплоен**
2. В `.env.local` переменная `NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM` **пустая**
3. Система автоматически переключается в **mock mode** (тестовый режим)

## Решение: Задеплоить контракт

### Шаг 1: Подготовка

1. Убедитесь что у вас есть AI3 токены на Autonomys Auto EVM:
   - **Testnet (Chronos)**: tAI3 токены
   - **Mainnet**: AI3 токены

2. Добавьте сеть в MetaMask:

**Для Testnet (Chronos):**
```
Network Name: AutoEVM Testnet (Chronos)
RPC URL: https://rpc-0.chronos.autonomys.xyz
Chain ID: 8700
Currency: tAI3
Explorer: https://explorer.auto-evm.chronos.autonomys.xyz
```

**Для Mainnet:**
```
Network Name: AutoEVM Mainnet
RPC URL: https://auto-evm.mainnet.autonomys.xyz
Chain ID: 870
Currency: AI3
Explorer: https://explorer.mainnet.autonomys.xyz
```

### Шаг 2: Деплой контракта через Remix IDE (Самый простой способ)

1. **Откройте Remix IDE**
   - Перейдите на https://remix.ethereum.org

2. **Создайте файл**
   - Создайте новый файл: `Subscription.sol`
   - Скопируйте содержимое из `contracts/Subscription.sol` в этот проект

3. **Скомпилируйте**
   - Перейдите на вкладку "Solidity Compiler"
   - Выберите версию: `0.8.30` или выше
   - Нажмите "Compile Subscription.sol"

4. **Подключитесь к сети**
   - Перейдите на вкладку "Deploy & Run Transactions"
   - Выберите "Environment": **"Injected Provider - MetaMask"**
   - Убедитесь что MetaMask подключен к правильной сети (Chronos Testnet или Mainnet)

5. **Задеплойте контракт**
   - Выберите контракт: `Subscription`
   - Нажмите **"Deploy"**
   - Подпишите транзакцию в MetaMask
   - Дождитесь подтверждения

6. **Скопируйте адрес контракта**
   - После деплоя скопируйте адрес контракта (например: `0x1234...5678`)

### Шаг 3: Настройка приложения

1. **Откройте `.env.local`**

2. **Добавьте адрес контракта:**
   ```env
   NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xВашАдресКонтракта
   ```

3. **Перезапустите сервер:**
   ```bash
   npm run dev
   ```

### Шаг 4: Проверка

1. Откройте `/pricing` страницу
2. Подключите кошелек
3. Попробуйте подписаться на план
4. **Теперь должно появиться окно MetaMask с запросом на подписание транзакции!** ✅

## Как работает система

### С контрактом (Production mode):
```
1. Пользователь нажимает "Subscribe"
2. Вызывается `writeContractAsync` (wagmi)
3. MetaMask показывает окно подписания транзакции
4. Пользователь подписывает транзакцию
5. Транзакция отправляется в блокчейн
6. После подтверждения подписка активируется
```

### Без контракта (Mock mode - текущее состояние):
```
1. Пользователь нажимает "Subscribe"
2. Вызывается `useMockSubscribe.subscribe()`
3. Подписка сохраняется только в localStorage
4. ❌ Нет реальной транзакции
5. ❌ Нет подписания в кошельке
6. ❌ Нет реального платежа
```

## Код, который определяет режим

Файл: `lib/subscription.ts`, строки 32-49:

```typescript
const useMockMode = () => {
  const { chainId } = useAccount();
  const contractAddress = chainId
    ? CONTRACT_ADDRESSES.subscription[
        chainId as keyof typeof CONTRACT_ADDRESSES.subscription
      ]
    : undefined;

  // Use mock mode if:
  // 1. Explicitly enabled via env var, OR
  // 2. Contract address is not configured
  return (
    process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION === "true" ||
    !contractAddress ||
    contractAddress === ""
  );
};
```

Если `contractAddress` пустой → используется mock mode.

## Дополнительная информация

- Полная документация по деплою: `contracts/DEPLOYMENT.md`
- Smart contract: `contracts/Subscription.sol`
- Тестирование подписки: `lib/subscription-mock.ts`

## Важно!

⚠️ **Для production** обязательно используйте реальный smart contract, а не mock mode!

Mock mode предназначен **только для разработки и тестирования UI** без реальных транзакций.
