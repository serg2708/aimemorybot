# Тестирование проверки transferOwnership()

## Цель теста:
Проверить, что функция `transferOwnership()` отклоняет попытку передать владение на `address(0)`

## Способ 1: Через Remix IDE (Рекомендуется)

### Шаг 1: Подготовка
1. Откройте https://remix.ethereum.org
2. Создайте файл `Subscription.sol`
3. Скопируйте код из `contracts/Subscription.sol`
4. Скомпилируйте контракт (версия 0.8.30+)

### Шаг 2: Деплой тестового контракта
1. Выберите "Environment": **"Remix VM (Shanghai)"** (локальная виртуальная сеть)
2. Нажмите **"Deploy"**
3. Контракт задеплоится мгновенно (бесплатно, без MetaMask)

### Шаг 3: Проверка owner
1. В разделе "Deployed Contracts" раскройте ваш контракт
2. Найдите функцию `owner` (синяя кнопка - view function)
3. Нажмите `owner`
4. Должен отобразиться ваш адрес (адрес аккаунта в Remix VM)

**Пример вывода:**
```
0x5B38Da6a701c568545dCfcB03FcB875f56beddC4
```

### Шаг 4: Тест 1 - Попытка передать владение на address(0) ❌

1. Найдите функцию `transferOwnership` (оранжевая кнопка - write function)
2. В поле `_newOwner` введите:
   ```
   0x0000000000000000000000000000000000000000
   ```
3. Нажмите **"transact"**

**Ожидаемый результат:**
```
❌ Transaction failed!
Error: VM error: revert.
revert
  The transaction has been reverted to the initial state.
Reason provided by the contract: "Invalid address"
```

✅ **Если видите эту ошибку - проверка работает!**

### Шаг 5: Тест 2 - Попытка передать владение на валидный адрес ✅

1. Скопируйте любой другой адрес из списка аккаунтов Remix (вверху страницы)

   Например:
   ```
   0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
   ```

2. Вставьте этот адрес в поле `_newOwner`
3. Нажмите **"transact"**

**Ожидаемый результат:**
```
✅ Transaction successful!
status: true
transaction hash: 0x...
```

4. Проверьте нового владельца:
   - Нажмите кнопку `owner`
   - Должен отобразиться новый адрес

**Пример вывода:**
```
0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2
```

✅ **Владелец изменился - функция работает корректно!**

---

## Способ 2: Через Hardhat/Foundry Tests

### Hardhat Test (JavaScript/TypeScript):

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Subscription - transferOwnership", function () {
  let subscription;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Subscription = await ethers.getContractFactory("Subscription");
    subscription = await Subscription.deploy();
    await subscription.deployed();
  });

  it("Should reject transfer to address(0)", async function () {
    await expect(
      subscription.transferOwnership(ethers.constants.AddressZero)
    ).to.be.revertedWith("Invalid address");
  });

  it("Should allow transfer to valid address", async function () {
    await subscription.transferOwnership(addr1.address);
    expect(await subscription.owner()).to.equal(addr1.address);
  });

  it("Should reject non-owner calling transferOwnership", async function () {
    await expect(
      subscription.connect(addr1).transferOwnership(addr1.address)
    ).to.be.revertedWith("Only owner can call this");
  });
});
```

**Запуск теста:**
```bash
npx hardhat test
```

---

## Способ 3: Через Foundry Tests (Solidity)

### Foundry Test:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/Subscription.sol";

contract SubscriptionTest is Test {
    Subscription subscription;
    address owner;
    address user1;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        subscription = new Subscription();
    }

    function testRejectTransferToAddressZero() public {
        vm.expectRevert("Invalid address");
        subscription.transferOwnership(address(0));
    }

    function testAllowTransferToValidAddress() public {
        subscription.transferOwnership(user1);
        assertEq(subscription.owner(), user1);
    }

    function testRejectNonOwnerTransfer() public {
        vm.prank(user1);
        vm.expectRevert("Only owner can call this");
        subscription.transferOwnership(user1);
    }
}
```

**Запуск теста:**
```bash
forge test -vv
```

---

## Способ 4: Через реальный деплой на Testnet

### ⚠️ ВНИМАНИЕ: Требуется tAI3 для газа!

1. Задеплойте контракт на Chronos Testnet
2. Откройте Block Explorer:
   ```
   https://explorer.auto-evm.chronos.autonomys.xyz/address/ВАШ_АДРЕС_КОНТРАКТА
   ```

3. Перейдите на вкладку **"Write Contract"**
4. Нажмите **"Connect Wallet"** (MetaMask)
5. Найдите функцию `transferOwnership`
6. Введите `0x0000000000000000000000000000000000000000`
7. Нажмите **"Write"**
8. Подпишите транзакцию в MetaMask

**Ожидаемый результат:**
```
❌ Transaction failed
Error: execution reverted: Invalid address
```

✅ **Проверка работает!**

---

## Проверка всех сценариев:

### ✅ Должно работать (успешно):
- Передача владения на валидный адрес владельцем
- Проверка текущего owner через `owner()`

### ❌ Должно НЕ работать (revert):
- Передача владения на `address(0)` → ❌ "Invalid address"
- Передача владения НЕ владельцем → ❌ "Only owner can call this"

---

## Быстрый тест (1 минута):

1. Откройте Remix: https://remix.ethereum.org
2. Создайте `Subscription.sol`, скопируйте код
3. Выберите "Remix VM (Shanghai)"
4. Нажмите "Deploy"
5. Попробуйте `transferOwnership(0x0000000000000000000000000000000000000000)`
6. Должна быть ошибка: "Invalid address" ✅

**Готово!** 🎉
