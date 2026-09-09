# 🤖 Автоматический вывод средств (Auto-Claim)

## ❓ Ваш вопрос: "Можно ли настроить автоматический клейм?"

**Краткий ответ:** ДА! Есть несколько способов.

---

## 🎯 Варианты автоматизации

### 1. ⚡ Chainlink Automation (Рекомендуется)
### 2. 🔧 Gelato Network
### 3. 🤖 Custom Bot (собственный скрипт)
### 4. 📱 Frontend Auto-Trigger
### 5. 🏗️ Smart Contract Auto-Withdraw

---

## ⚡ Вариант 1: Chainlink Automation (бывший Keepers)

### Что это?
Децентрализованная сеть нод которая автоматически вызывает функции вашего контракта по расписанию или условию.

### Как работает:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Subscription Contract с Chainlink Automation
 * @notice Автоматически выводит средства когда накопилось достаточно
 */
contract SubscriptionWithAutomation is
    AutomationCompatibleInterface,
    Ownable2Step,
    ReentrancyGuard,
    Pausable
{
    // ... существующий код ...

    uint256 public pendingWithdrawal;

    // Настройки автоматического вывода
    uint256 public autoWithdrawThreshold = 10 ether; // Выводить когда накопилось 10 AI3
    uint256 public minWithdrawInterval = 1 days;      // Минимум раз в день
    uint256 public lastWithdrawTime;

    /**
     * @notice Chainlink Automation вызывает эту функцию для проверки
     * @dev Возвращает true если нужно вывести средства
     */
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        // Условие 1: Накопилось достаточно средств
        bool thresholdMet = pendingWithdrawal >= autoWithdrawThreshold;

        // Условие 2: Прошло достаточно времени
        bool intervalPassed = block.timestamp >= lastWithdrawTime + minWithdrawInterval;

        // Условие 3: Есть что выводить
        bool hasFunds = pendingWithdrawal > 0;

        // Условие 4: Контракт не на паузе
        bool notPaused = !paused();

        upkeepNeeded = (thresholdMet || intervalPassed) && hasFunds && notPaused;
    }

    /**
     * @notice Chainlink Automation автоматически вызывает эту функцию
     * @dev Выводит накопленные средства owner
     */
    function performUpkeep(bytes calldata /* performData */)
        external
        override
        nonReentrant
    {
        // Revalidate условие (защита)
        if (pendingWithdrawal == 0) revert("No funds to withdraw");

        uint256 amount = pendingWithdrawal;
        pendingWithdrawal = 0;
        lastWithdrawTime = block.timestamp;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner(), amount);
        emit AutoWithdrawExecuted(amount, block.timestamp);
    }

    /**
     * @notice Owner может изменить параметры автовывода
     */
    function setAutoWithdrawParams(
        uint256 _threshold,
        uint256 _interval
    ) external onlyOwner {
        require(_threshold > 0, "Threshold must be > 0");
        require(_interval >= 1 hours, "Interval too short");

        autoWithdrawThreshold = _threshold;
        minWithdrawInterval = _interval;

        emit AutoWithdrawParamsUpdated(_threshold, _interval);
    }

    // Events
    event AutoWithdrawExecuted(uint256 amount, uint256 timestamp);
    event AutoWithdrawParamsUpdated(uint256 threshold, uint256 interval);

    // ... остальной код контракта ...
}
```

### Настройка Chainlink Automation:

```javascript
// 1. Деплой контракта с Automation
npx hardhat run scripts/deploy-with-automation.js --network chronos

// 2. Регистрация Upkeep на Chainlink
// Перейти: https://automation.chain.link/
// - Connect Wallet
// - Register New Upkeep
// - Contract Address: 0x... (ваш контракт)
// - Gas Limit: 500,000
// - Starting Balance: 10 LINK (для оплаты gas)
// - Check Interval: Custom Logic (наша функция checkUpkeep)

// 3. Пополнить LINK баланс для оплаты gas
```

### Плюсы Chainlink Automation:

✅ **Децентрализованная** - не зависит от вашего сервера
✅ **Надёжная** - сеть нод обеспечивает uptime 99.9%
✅ **Гибкая** - можно задать любые условия в checkUpkeep()
✅ **Прозрачная** - все вызовы on-chain
✅ **Безопасная** - проверенная индустрией

### Минусы:

⚠️ Требует LINK токены для оплаты gas
⚠️ Дополнительная сложность контракта
⚠️ Может не поддерживаться на Autonomys (нужно проверить)

### Стоимость:

```
Gas за вызов performUpkeep(): ~50,000 gas
Частота вызовов: раз в день
Стоимость в месяц: ~1,500,000 gas ≈ $5-10 (в LINK)
```

---

## 🔧 Вариант 2: Gelato Network

### Что это?
Альтернатива Chainlink - автоматизация задач в блокчейне.

### Как работает:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AutomateTaskCreator} from "@gelatonetwork/automate/contracts/integrations/AutomateTaskCreator.sol";

contract SubscriptionWithGelato is AutomateTaskCreator {
    uint256 public pendingWithdrawal;
    bytes32 public autoWithdrawTaskId;

    constructor(address _automate, address _fundsOwner)
        AutomateTaskCreator(_automate, _fundsOwner)
    {
        // Создаём автоматическую задачу
        _createAutoWithdrawTask();
    }

    function _createAutoWithdrawTask() internal {
        // Проверка условия
        bytes memory resolverData = abi.encodeWithSelector(
            this.shouldWithdraw.selector
        );

        // Функция для выполнения
        bytes memory execData = abi.encodeWithSelector(
            this.autoWithdraw.selector
        );

        // Создаём задачу
        autoWithdrawTaskId = _createTask(
            address(this),  // Контракт
            execData,       // Функция для вызова
            resolverData,   // Условие проверки
            ETH             // Оплата в ETH
        );
    }

    // Gelato проверяет это условие
    function shouldWithdraw() external view returns (bool canExec, bytes memory execPayload) {
        canExec = pendingWithdrawal >= 10 ether;
        execPayload = abi.encodeWithSelector(this.autoWithdraw.selector);
    }

    // Gelato автоматически вызывает
    function autoWithdraw() external onlyDedicatedMsgSender {
        uint256 amount = pendingWithdrawal;
        pendingWithdrawal = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success);

        emit AutoWithdrawExecuted(amount);
    }
}
```

### Настройка:

```javascript
// 1. Установить зависимости
npm install @gelatonetwork/automate

// 2. Деплой
npx hardhat run scripts/deploy-gelato.js --network chronos

// 3. Пополнить баланс на Gelato
// https://app.gelato.network/
```

### Плюсы:

✅ Проще чем Chainlink
✅ Меньше кода
✅ Оплата в ETH/AI3 (не нужен LINK)
✅ Удобный UI

### Минусы:

⚠️ Менее децентрализован чем Chainlink
⚠️ Может не поддерживаться на Autonomys

---

## 🤖 Вариант 3: Custom Bot (Собственный скрипт)

### Что это?
Простой Node.js скрипт который мониторит контракт и вызывает withdrawFunds().

### Код бота:

```javascript
// auto-withdraw-bot.js
require('dotenv').config();
const { ethers } = require('ethers');

// Настройки
const RPC_URL = process.env.AUTO_EVM_RPC;
const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const WITHDRAW_THRESHOLD = ethers.parseEther("10"); // 10 AI3
const CHECK_INTERVAL = 60 * 60 * 1000; // Проверять каждый час

// ABI (только нужные функции)
const ABI = [
  "function getPendingWithdrawal() view returns (uint256)",
  "function withdrawFunds()",
  "event FundsWithdrawn(address indexed to, uint256 amount)"
];

// Подключение к сети
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Логирование
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// Основная функция
async function checkAndWithdraw() {
  try {
    // Проверяем сколько накопилось
    const pending = await contract.getPendingWithdrawal();
    log(`Pending withdrawal: ${ethers.formatEther(pending)} AI3`);

    // Если достаточно - выводим
    if (pending >= WITHDRAW_THRESHOLD) {
      log(`Threshold met! Withdrawing ${ethers.formatEther(pending)} AI3...`);

      const tx = await contract.withdrawFunds({
        gasLimit: 100000
      });

      log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      log(`✅ Withdrawal successful! Block: ${receipt.blockNumber}`);

      // Получаем событие
      const event = receipt.logs.find(
        log => log.eventName === 'FundsWithdrawn'
      );
      if (event) {
        log(`Amount withdrawn: ${ethers.formatEther(event.args.amount)} AI3`);
      }
    } else {
      log(`Below threshold. Waiting... (${ethers.formatEther(WITHDRAW_THRESHOLD - pending)} AI3 to go)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Уведомление (опционально)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await sendTelegramAlert(`Auto-withdraw error: ${error.message}`);
    }
  }
}

// Telegram уведомления (опционально)
async function sendTelegramAlert(message) {
  const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `🤖 Auto-Withdraw Bot\n\n${message}`,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram notification failed:', err);
  }
}

// Запуск бота
async function start() {
  log('🤖 Auto-Withdraw Bot started');
  log(`Monitoring contract: ${CONTRACT_ADDRESS}`);
  log(`Withdraw threshold: ${ethers.formatEther(WITHDRAW_THRESHOLD)} AI3`);
  log(`Check interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
  log('---');

  // Первая проверка сразу
  await checkAndWithdraw();

  // Затем по расписанию
  setInterval(checkAndWithdraw, CHECK_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Bot stopped');
  process.exit(0);
});

// Запуск
start().catch(console.error);
```

### .env конфигурация:

```bash
# .env (НЕ коммитить!)
AUTO_EVM_RPC=https://auto-evm.chronos.autonomys.xyz/ws
OWNER_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=0xYourContractAddress

# Telegram уведомления (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Запуск бота:

```bash
# 1. Установить зависимости
npm install dotenv ethers

# 2. Запустить бота
node auto-withdraw-bot.js

# Вывод:
# [2025-12-31T12:00:00.000Z] 🤖 Auto-Withdraw Bot started
# [2025-12-31T12:00:00.000Z] Monitoring contract: 0x...
# [2025-12-31T12:00:00.000Z] Withdraw threshold: 10.0 AI3
# [2025-12-31T12:00:00.000Z] Check interval: 60 minutes
# [2025-12-31T12:00:00.000Z] ---
# [2025-12-31T12:00:01.000Z] Pending withdrawal: 15.5 AI3
# [2025-12-31T12:00:01.000Z] Threshold met! Withdrawing 15.5 AI3...
# [2025-12-31T12:00:02.000Z] Transaction sent: 0xabc...
# [2025-12-31T12:00:05.000Z] ✅ Withdrawal successful! Block: 123456
```

### Деплой бота на сервер:

```bash
# Вариант 1: PM2 (Node.js process manager)
npm install -g pm2
pm2 start auto-withdraw-bot.js --name "auto-withdraw"
pm2 save
pm2 startup

# Вариант 2: Docker
docker build -t auto-withdraw-bot .
docker run -d --env-file .env auto-withdraw-bot

# Вариант 3: systemd (Linux)
sudo nano /etc/systemd/system/auto-withdraw.service
sudo systemctl enable auto-withdraw
sudo systemctl start auto-withdraw
```

### Плюсы Custom Bot:

✅ **Полный контроль** - вы управляете всем
✅ **Дёшево** - только gas за транзакции
✅ **Просто** - ~100 строк кода
✅ **Гибко** - можно добавить любую логику
✅ **Уведомления** - Telegram/Email alerts

### Минусы:

⚠️ Требует сервер (VPS)
⚠️ Нужно следить за uptime
⚠️ Централизованное решение
⚠️ Приватный ключ на сервере (риск)

---

## 📱 Вариант 4: Frontend Auto-Trigger

### Что это?
Предлагать пользователям вызвать withdrawFunds() за вознаграждение.

### Код контракта:

```solidity
contract SubscriptionWithRewards is Ownable2Step, ReentrancyGuard, Pausable {
    uint256 public pendingWithdrawal;
    uint256 public withdrawRewardPercent = 1; // 1% награда тому кто вызовет

    /**
     * @notice Любой может вызвать и получить 1% вознаграждение
     */
    function publicWithdraw() external nonReentrant {
        uint256 amount = pendingWithdrawal;
        require(amount > 0, "No funds");

        // Вычисляем награду (1%)
        uint256 reward = amount * withdrawRewardPercent / 100;
        uint256 ownerAmount = amount - reward;

        pendingWithdrawal = 0;

        // Отправляем owner
        (bool success1, ) = owner().call{value: ownerAmount}("");
        require(success1, "Owner transfer failed");

        // Отправляем награду вызвавшему
        (bool success2, ) = msg.sender.call{value: reward}("");
        require(success2, "Reward transfer failed");

        emit PublicWithdrawExecuted(msg.sender, ownerAmount, reward);
    }

    event PublicWithdrawExecuted(
        address indexed caller,
        uint256 ownerAmount,
        uint256 reward
    );
}
```

### Frontend компонент:

```typescript
// components/auto-withdraw-button.tsx
import { useContractWrite } from 'wagmi';
import { useState, useEffect } from 'react';

export function AutoWithdrawButton() {
  const [pending, setPending] = useState(0n);
  const [reward, setReward] = useState(0n);

  // Читаем pendingWithdrawal
  useEffect(() => {
    async function fetchPending() {
      const amount = await contract.getPendingWithdrawal();
      setPending(amount);
      setReward(amount / 100n); // 1% награда
    }

    const interval = setInterval(fetchPending, 10000); // Каждые 10 сек
    fetchPending();

    return () => clearInterval(interval);
  }, []);

  const { write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'publicWithdraw',
  });

  if (pending < parseEther("10")) return null; // Скрываем если мало

  return (
    <div className="border border-green-500 rounded-lg p-4 bg-green-50">
      <h3 className="font-bold text-green-700">
        💰 Заработай {formatEther(reward)} AI3!
      </h3>
      <p className="text-sm text-gray-600 mt-2">
        Помоги вывести средства из контракта и получи {formatEther(reward)} AI3 награду
      </p>
      <button
        onClick={() => write?.()}
        className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Вывести и получить {formatEther(reward)} AI3
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Всего к выводу: {formatEther(pending)} AI3
      </p>
    </div>
  );
}
```

### Плюсы:

✅ Не требует сервер
✅ Децентрализованное
✅ Пользователи получают награду
✅ Owner платит только за транзакции

### Минусы:

⚠️ Зависит от активности пользователей
⚠️ Owner теряет 1% на награду
⚠️ Может быть frontrunning (MEV атака)

---

## 🏗️ Вариант 5: Smart Contract Auto-Withdraw (On-Chain)

### Что это?
Автоматический вывод встроен в subscribe() - при каждой подписке проверяется порог.

### Код:

```solidity
contract SubscriptionWithAutoWithdraw is Ownable2Step, ReentrancyGuard, Pausable {
    uint256 public pendingWithdrawal;
    uint256 public autoWithdrawThreshold = 10 ether; // 10 AI3

    function subscribe(Plan _plan, uint256 _duration)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        // ... обычная логика подписки ...

        // Добавляем платёж
        pendingWithdrawal += msg.value;

        emit Subscribed(msg.sender, _plan, _duration, expiresAt, msg.value);

        // АВТОМАТИЧЕСКИЙ ВЫВОД если порог достигнут
        if (pendingWithdrawal >= autoWithdrawThreshold) {
            _autoWithdraw();
        }
    }

    /**
     * @notice Внутренняя функция автовывода
     */
    function _autoWithdraw() internal {
        uint256 amount = pendingWithdrawal;
        pendingWithdrawal = 0;

        // Отправляем owner
        (bool success, ) = owner().call{value: amount}("");

        // Если не удалось - возвращаем обратно
        if (!success) {
            pendingWithdrawal = amount;
            emit AutoWithdrawFailed(amount);
        } else {
            emit AutoWithdrawExecuted(amount);
        }
    }

    /**
     * @notice Owner может изменить порог
     */
    function setAutoWithdrawThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold > 0, "Threshold must be > 0");
        autoWithdrawThreshold = _threshold;
        emit ThresholdUpdated(_threshold);
    }

    event AutoWithdrawExecuted(uint256 amount);
    event AutoWithdrawFailed(uint256 amount);
    event ThresholdUpdated(uint256 newThreshold);
}
```

### Плюсы:

✅ Полностью автоматический
✅ Не требует внешних сервисов
✅ Простая логика
✅ Gas оптимизирован (вызов внутри subscribe)

### Минусы:

⚠️ Пользователь платит газ за вывод owner
⚠️ Если owner.receive() падает - подписка откатывается (DoS!)
⚠️ Не рекомендуется из-за DoS риска

---

## 📊 Сравнение всех вариантов

| Параметр | Chainlink | Gelato | Custom Bot | Frontend Trigger | On-Chain Auto |
|----------|-----------|--------|------------|------------------|---------------|
| **Децентрализация** | ✅✅✅ | ✅✅ | ❌ | ✅✅ | ✅✅✅ |
| **Надёжность** | ✅✅✅ | ✅✅ | ⚠️ | ⚠️ | ✅✅ |
| **Стоимость** | $$$ | $$ | $ | ✅ Free | ✅ Free |
| **Сложность** | ⚠️⚠️ | ⚠️ | ✅ Easy | ✅ Easy | ✅ Easy |
| **DoS риск** | ✅ Безопасно | ✅ Безопасно | ✅ Безопасно | ✅ Безопасно | ❌ Уязвимо |
| **Требует сервер** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Рекомендуется** | ✅ Да | ✅ Да | ✅ Да | ⚠️ Опционально | ❌ Нет |

---

## 🎯 Рекомендация для вашего проекта

### Для тестнета (сейчас):

**→ Custom Bot (Вариант 3)**

Почему:
- ✅ Просто настроить
- ✅ Полный контроль
- ✅ Дёшево
- ✅ Можно быстро изменить логику

```bash
# Запустить за 5 минут:
node auto-withdraw-bot.js
```

### Для mainnet (в будущем):

**→ Chainlink Automation (Вариант 1)**

Почему:
- ✅ Максимальная надёжность
- ✅ Децентрализованный
- ✅ Проверенный индустрией
- ✅ Не зависит от вашего сервера

---

## 🚀 Готовый код для запуска

Создам полный рабочий пример Custom Bot:

### 1. Структура проекта:

```
/auto-withdraw-bot/
├── package.json
├── .env
├── .env.example
├── bot.js
├── Dockerfile (опционально)
└── ecosystem.config.js (для PM2)
```

### 2. Минимальный bot.js:

```javascript
require('dotenv').config();
const { ethers } = require('ethers');

const config = {
  rpc: process.env.AUTO_EVM_RPC,
  privateKey: process.env.OWNER_PRIVATE_KEY,
  contract: process.env.CONTRACT_ADDRESS,
  threshold: ethers.parseEther(process.env.WITHDRAW_THRESHOLD || "10"),
  interval: parseInt(process.env.CHECK_INTERVAL || "3600") * 1000,
};

const ABI = [
  "function getPendingWithdrawal() view returns (uint256)",
  "function withdrawFunds()"
];

const provider = new ethers.JsonRpcProvider(config.rpc);
const wallet = new ethers.Wallet(config.privateKey, provider);
const contract = new ethers.Contract(config.contract, ABI, wallet);

async function run() {
  const pending = await contract.getPendingWithdrawal();
  console.log(`Pending: ${ethers.formatEther(pending)} AI3`);

  if (pending >= config.threshold) {
    console.log('Withdrawing...');
    const tx = await contract.withdrawFunds();
    await tx.wait();
    console.log('✅ Done!');
  }
}

run();
setInterval(run, config.interval);
```

---

## 💡 Дополнительные фичи бота

### Мониторинг здоровья:

```javascript
// Healthcheck endpoint
const express = require('express');
const app = express();

let lastCheck = Date.now();
let lastWithdraw = null;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    lastCheck: new Date(lastCheck),
    lastWithdraw: lastWithdraw,
    uptime: process.uptime()
  });
});

app.listen(3001);
```

### Slack/Discord уведомления:

```javascript
async function notifySlack(message) {
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}

// После вывода
await notifySlack(`✅ Withdrawn ${ethers.formatEther(amount)} AI3`);
```

---

## 🎓 Вывод

### Краткий ответ на ваш вопрос:

**Да, можно настроить автоматический клейм!**

**Самый простой способ для старта:**
```bash
# 1. Создать bot.js (100 строк)
# 2. Запустить: node bot.js
# 3. Profit! ✅
```

**Самый надёжный способ для production:**
```solidity
// Добавить Chainlink Automation в контракт
// Настроить на automation.chain.link
// Забыть и наслаждаться автоматическими выводами
```

Какой вариант вам больше подходит? Могу помочь настроить любой из них! 🚀
