# Security Audit Guide - Subscription Smart Contract

## 🔒 Comprehensive Security Testing Checklist

This guide covers all major attack vectors and testing methodologies for the Subscription.sol contract.

---

## 📋 Table of Contents

1. [Automated Security Scanners](#automated-security-scanners)
2. [Manual Security Review](#manual-security-review)
3. [Attack Vectors & Tests](#attack-vectors--tests)
4. [Wallet Security](#wallet-security)
5. [Gas Optimization](#gas-optimization)

---

## 🤖 Automated Security Scanners

### 1. **Slither** (Static Analysis)

```bash
# Install Slither
pip3 install slither-analyzer

# Run analysis
slither contracts/Subscription.sol

# Run specific detectors
slither contracts/Subscription.sol --detect reentrancy-eth,tx-origin,unchecked-transfer
```

**What it detects:**
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Uninitialized storage pointers
- Dangerous delegatecall
- tx.origin usage
- Unchecked external calls

### 2. **Mythril** (Symbolic Execution)

```bash
# Install Mythril
pip3 install mythril

# Run analysis
myth analyze contracts/Subscription.sol

# Deep analysis (slower)
myth analyze contracts/Subscription.sol --execution-timeout 900
```

**What it detects:**
- Reentrancy
- Integer arithmetic bugs
- Unprotected Ether withdrawal
- Delegatecall to untrusted contract
- State change after external call

### 3. **Echidna** (Fuzzing)

```bash
# Install Echidna
docker pull trailofbits/eth-security-toolbox

# Run fuzzing
echidna-test contracts/Subscription.sol --contract Subscription
```

**What it does:**
- Property-based testing
- Finds edge cases
- Tests invariants

### 4. **MythX** (Commercial Service)

```bash
# Install MythX CLI
pip3 install mythx-cli

# Analyze
mythx analyze contracts/Subscription.sol
```

### 5. **Manticore** (Symbolic Execution)

```bash
# Install Manticore
pip3 install manticore

# Analyze
manticore contracts/Subscription.sol
```

---

## 🔍 Manual Security Review

### Critical Issues to Check:

#### ✅ 1. **Reentrancy Protection**

**Current Status:** ⚠️ **VULNERABLE**

**Lines 93-94, 120-121:**
```solidity
(bool success, ) = owner.call{value: msg.value}("");
require(success, "Payment transfer failed");
```

**Problem:** State is updated BEFORE external call
**Fix Required:** Use Checks-Effects-Interactions pattern

**Recommended Fix:**
```solidity
// GOOD - Update state BEFORE external call
sub.plan = _plan;
sub.expiresAt = expiresAt;
sub.isActive = true;

// Then make external call
(bool success, ) = owner.call{value: msg.value}("");
require(success, "Payment transfer failed");

// OR use ReentrancyGuard from OpenZeppelin
```

#### ✅ 2. **Integer Overflow/Underflow**

**Current Status:** ✅ **SAFE** (Solidity 0.8.30 has built-in checks)

**Lines to verify:**
- Line 81: `expiresAt = sub.expiresAt + _duration`
- Line 84: `expiresAt = block.timestamp + _duration`
- Line 114: `sub.expiresAt += _duration`

**Note:** Solidity 0.8+ automatically reverts on overflow

#### ✅ 3. **Access Control**

**Current Status:** ⚠️ **NEEDS IMPROVEMENT**

**Issues:**
1. **No 2-step ownership transfer** (Line 182-185)
   - Risk: Owner could transfer to wrong address permanently

2. **No emergency pause mechanism**
   - Risk: Cannot stop contract in case of exploit

**Recommended Fix:**
```solidity
// Use OpenZeppelin Ownable2Step
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Subscription is Ownable2Step {
    // ...
}
```

#### ✅ 4. **Denial of Service (DoS)**

**Current Status:** ⚠️ **VULNERABLE**

**Lines 93-94, 120-121:**
```solidity
(bool success, ) = owner.call{value: msg.value}("");
require(success, "Payment transfer failed");
```

**Attack:** If owner is a contract that always reverts, all subscriptions fail

**Recommended Fix:**
```solidity
// Pull payment pattern
mapping(address => uint256) public pendingWithdrawals;

function subscribe(...) external payable {
    // ... validation ...

    // Store payment for owner to withdraw later
    pendingWithdrawals[owner] += msg.value;

    // No external call here!
}

function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "No funds to withdraw");

    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Withdrawal failed");
}
```

#### ✅ 5. **Front-Running**

**Current Status:** ⚠️ **POSSIBLE**

**Issue:** Price changes could be front-run if prices are stored on-chain

**Mitigation:**
- Use commit-reveal scheme for sensitive operations
- Add deadline parameter to transactions
- Use private transactions (Flashbots)

#### ✅ 6. **Timestamp Manipulation**

**Current Status:** ⚠️ **LOW RISK**

**Lines using block.timestamp:**
- Line 79, 84, 113, 116, 158, 175

**Risk:** Miners can manipulate timestamp by ~900 seconds

**Impact:** Low - subscription times don't need second-level precision

#### ✅ 7. **Gas Griefing**

**Current Status:** ✅ **SAFE**

External calls use all available gas, which is correct.

---

## 💀 Attack Vectors & Tests

### 1. **Reentrancy Attack**

**Test scenario:**
```solidity
// Malicious contract
contract ReentrancyAttack {
    Subscription public victim;

    constructor(address _victim) {
        victim = Subscription(_victim);
    }

    receive() external payable {
        // Try to call subscribe again during payment
        if (address(victim).balance > 0) {
            victim.subscribe{value: 1 ether}(Plan.BASIC, 30 days);
        }
    }

    function attack() external payable {
        victim.subscribe{value: msg.value}(Plan.BASIC, 30 days);
    }
}
```

**Current vulnerability:** Owner's receive() could call back into contract

### 2. **Integer Overflow Attack**

**Test scenario:**
```solidity
// Try to overflow expiresAt
function testOverflow() public {
    uint256 maxDuration = type(uint256).max;
    subscription.subscribe{value: 1 ether}(Plan.BASIC, maxDuration);
    // Should revert in Solidity 0.8+
}
```

**Status:** Protected by Solidity 0.8+

### 3. **Unauthorized Access**

**Test scenario:**
```solidity
// Non-owner tries to transfer ownership
vm.prank(attacker);
subscription.transferOwnership(attacker);
// Should revert
```

### 4. **DoS via Revert**

**Test scenario:**
```solidity
// Owner is a contract that always reverts
contract MaliciousOwner {
    receive() external payable {
        revert("DoS attack");
    }
}

// Set as owner
subscription.transferOwnership(address(maliciousOwner));

// All subscriptions will fail now!
```

### 5. **Selfdestruct Griefing**

**Test scenario:**
```solidity
contract SelfdestructAttack {
    function attack(address payable target) external payable {
        selfdestruct(target);
    }
}

// Force-send ether to subscription contract
// This bypasses receive() function
```

**Impact:** Can manipulate contract balance

### 6. **Storage Collision**

**Status:** ✅ No delegatecall, safe from storage collision

### 7. **Signature Replay**

**Status:** ✅ No signatures used

---

## 👛 Wallet Security Tests

### User Wallet Attack Vectors:

#### 1. **Private Key Extraction**
- ❌ Contract CANNOT extract private keys
- ✅ Contract only stores public addresses

#### 2. **Approval Hijacking**
- ❌ Not applicable (uses native tokens, not ERC20)
- ✅ No approval mechanism

#### 3. **Phishing via Events**
- ⚠️ Events could be spoofed
- **Mitigation:** Frontend should verify events from correct contract

#### 4. **Transaction Malleability**
- ✅ Not vulnerable (modern Ethereum)

#### 5. **MEV (Miner Extractable Value)**
- ⚠️ Subscription price changes could be front-run
- **Mitigation:** Use private mempool or commit-reveal

---

## 🔧 Testing Setup

### 1. Install Dependencies

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Install OpenZeppelin
npm install @openzeppelin/contracts

# Install testing libraries
npm install --save-dev @nomicfoundation/hardhat-chai-matchers chai ethers
```

### 2. Create Test File

Create `test/Subscription.security.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Subscription Security Tests", function () {
  let subscription;
  let owner, user1, user2, attacker;

  beforeEach(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

    const Subscription = await ethers.getContractFactory("Subscription");
    subscription = await Subscription.deploy();
    await subscription.deployed();
  });

  describe("Reentrancy Tests", function () {
    it("should prevent reentrancy attacks", async function () {
      // Deploy malicious contract
      const ReentrancyAttack = await ethers.getContractFactory("ReentrancyAttack");
      const attack = await ReentrancyAttack.deploy(subscription.address);

      // Attempt attack
      await expect(
        attack.attack({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("Reentrancy detected");
    });
  });

  describe("Access Control Tests", function () {
    it("should prevent non-owner from transferring ownership", async function () {
      await expect(
        subscription.connect(attacker).transferOwnership(attacker.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("should prevent ownership transfer to zero address", async function () {
      await expect(
        subscription.transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Integer Overflow Tests", function () {
    it("should revert on duration overflow", async function () {
      const maxUint256 = ethers.constants.MaxUint256;

      await expect(
        subscription.subscribe(1, maxUint256, {
          value: ethers.utils.parseEther("1")
        })
      ).to.be.reverted; // Overflow protection
    });
  });

  describe("DoS Tests", function () {
    it("should handle owner contract that reverts", async function () {
      // Deploy reverting contract
      const RevertingOwner = await ethers.getContractFactory("RevertingOwner");
      const revertingOwner = await RevertingOwner.deploy();

      // Transfer ownership
      await subscription.transferOwnership(revertingOwner.address);

      // Try to subscribe - should fail
      await expect(
        subscription.connect(user1).subscribe(1, 2592000, {
          value: ethers.utils.parseEther("1")
        })
      ).to.be.revertedWith("Payment transfer failed");
    });
  });

  describe("Payment Tests", function () {
    it("should reject zero payment", async function () {
      await expect(
        subscription.subscribe(1, 2592000, { value: 0 })
      ).to.be.revertedWith("Payment required");
    });

    it("should reject zero duration", async function () {
      await expect(
        subscription.subscribe(1, 0, {
          value: ethers.utils.parseEther("1")
        })
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });
});
```

### 3. Run Tests

```bash
npx hardhat test test/Subscription.security.test.js
```

---

## 🛡️ Security Recommendations

### HIGH PRIORITY:

1. **✅ Add ReentrancyGuard**
   ```solidity
   import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

   contract Subscription is ReentrancyGuard {
       function subscribe(...) external payable nonReentrant {
           // ...
       }
   }
   ```

2. **✅ Implement Pull Payment Pattern**
   - Avoid DoS attacks
   - Safer than push payments

3. **✅ Use Ownable2Step**
   - Prevent accidental ownership transfer
   - Require 2-step confirmation

4. **✅ Add Pausable**
   - Emergency stop mechanism
   - Control in case of exploit

### MEDIUM PRIORITY:

5. **Add Price Oracle**
   - Prevent front-running
   - Consistent pricing

6. **Event Verification**
   - Add indexed parameters
   - Include contract version in events

7. **Rate Limiting**
   - Prevent spam attacks
   - Limit subscriptions per block

### LOW PRIORITY:

8. **Gas Optimization**
   - Pack storage variables
   - Use immutable where possible

9. **Upgrade Pattern**
   - Consider proxy pattern for upgrades
   - Plan for future improvements

---

## 📊 Vulnerability Severity Matrix

| Vulnerability | Severity | Exploitable | Impact | Status |
|--------------|----------|-------------|--------|--------|
| Reentrancy | 🔴 HIGH | Yes | Drain funds | VULNERABLE |
| DoS via Revert | 🔴 HIGH | Yes | Block all subs | VULNERABLE |
| Ownership Transfer | 🟡 MEDIUM | Accidental | Lose control | NEEDS IMPROVEMENT |
| Front-running | 🟡 MEDIUM | Yes | Price manipulation | POSSIBLE |
| Integer Overflow | 🟢 LOW | No | Protected by 0.8+ | SAFE |
| Timestamp Manipulation | 🟢 LOW | Limited | ±15 min variance | LOW RISK |

---

## 🔬 Advanced Testing Tools

### 1. Formal Verification

```bash
# Certora Prover
certoraRun contracts/Subscription.sol --verify Subscription:specs/Subscription.spec
```

### 2. Differential Testing

Compare your contract against reference implementations:

```bash
# Use echidna for differential fuzzing
echidna-test . --contract Subscription --test-mode assertion
```

### 3. Static Analysis Suite

```bash
# Run complete analysis suite
docker run -v $(pwd):/project trailofbits/eth-security-toolbox

# Inside container:
cd /project
slither . --checklist
```

---

## 📝 Audit Checklist

- [ ] Run Slither analysis
- [ ] Run Mythril symbolic execution
- [ ] Run Echidna fuzzing
- [ ] Manual code review completed
- [ ] All tests passing
- [ ] Reentrancy protection added
- [ ] Pull payment pattern implemented
- [ ] Access control verified
- [ ] Integer overflow checked
- [ ] DoS vectors mitigated
- [ ] Events properly indexed
- [ ] Gas optimization reviewed
- [ ] Emergency pause mechanism
- [ ] External audit (optional but recommended)

---

## 🚨 Red Flags Found

### 🔴 CRITICAL:
1. **Reentrancy vulnerability** in subscribe() and extendSubscription()
2. **DoS vulnerability** if owner is malicious contract

### 🟡 WARNINGS:
1. No emergency pause mechanism
2. Single-step ownership transfer
3. No pull payment pattern

### 🟢 RECOMMENDATIONS:
1. Add comprehensive events
2. Implement rate limiting
3. Gas optimizations

---

## 📞 Next Steps

1. **Fix critical vulnerabilities** (reentrancy, DoS)
2. **Run automated scanners** to verify fixes
3. **Write comprehensive tests** for all attack vectors
4. **Consider professional audit** before mainnet deployment
5. **Implement bug bounty program** after launch

---

## 📚 Additional Resources

- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [SWC Registry](https://swcregistry.io/) - Smart Contract Weakness Classification
- [Rekt News](https://rekt.news/) - Learn from real hacks
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Trail of Bits Blog](https://blog.trailofbits.com/)

---

## ⚖️ Legal Disclaimer

This audit guide is for educational purposes. No guarantee of security is provided.
Always conduct professional audits before deploying to mainnet with real funds.
