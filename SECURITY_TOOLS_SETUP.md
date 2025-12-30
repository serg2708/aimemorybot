# Security Tools Setup Guide

## 🛠️ Quick Installation Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm/yarn
- Git

---

## 1️⃣ Install Slither (Static Analysis)

```bash
# Install via pip
pip3 install slither-analyzer

# Verify installation
slither --version

# Install Solc (Solidity compiler)
pip3 install solc-select
solc-select install 0.8.30
solc-select use 0.8.30
```

**What Slither detects:**
- Reentrancy
- Uninitialized variables
- Dangerous delegatecall
- Integer overflow (pre-0.8)
- tx.origin usage
- And 70+ other vulnerabilities

---

## 2️⃣ Install Mythril (Symbolic Execution)

```bash
# Install via pip
pip3 install mythril

# Verify installation
myth version

# Optional: Install via Docker
docker pull mythril/myth
```

**What Mythril detects:**
- Integer overflow/underflow
- Reentrancy
- Unprotected functions
- Transaction ordering dependence
- Delegatecall issues

---

## 3️⃣ Install Echidna (Fuzzing)

```bash
# Download latest release
wget https://github.com/crytic/echidna/releases/download/v2.2.1/echidna-2.2.1-Linux.tar.gz

# Extract
tar -xzf echidna-2.2.1-Linux.tar.gz

# Move to PATH
sudo mv echidna /usr/local/bin/

# Verify
echidna --version

# Alternative: Docker
docker pull trailofbits/echidna
```

**What Echidna does:**
- Property-based fuzzing
- Finds edge cases
- Tests contract invariants

---

## 4️⃣ Install Solhint (Linting)

```bash
# Install globally
npm install -g solhint

# Verify
solhint --version

# Create config file
cat > .solhint.json << 'EOF'
{
  "extends": "solhint:recommended",
  "rules": {
    "compiler-version": ["error", "^0.8.0"],
    "func-visibility": ["warn", {"ignoreConstructors": true}],
    "not-rely-on-time": "warn",
    "avoid-tx-origin": "error",
    "no-empty-blocks": "warn"
  }
}
EOF
```

---

## 5️⃣ Install Manticore (Optional - Advanced)

```bash
# Install via pip
pip3 install manticore[native]

# Verify
manticore --version
```

---

## 6️⃣ Install MythX CLI (Optional - Commercial)

```bash
# Install MythX
pip3 install mythx-cli

# Login (requires account)
mythx login

# Free tier: 5 scans/month
# Paid tier: Unlimited scans
```

Create account at: https://mythx.io/

---

## 7️⃣ Install Hardhat (Testing Framework)

```bash
# Already in your project
npm install --save-dev hardhat

# Install testing plugins
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev @nomicfoundation/hardhat-chai-matchers
npm install --save-dev chai ethers

# Install OpenZeppelin (for secure contract fixes)
npm install @openzeppelin/contracts
```

---

## 8️⃣ Docker-Based Setup (Easiest)

### Trail of Bits Security Toolbox (All-in-One)

```bash
# Pull the image (includes Slither, Echidna, Manticore, etc.)
docker pull trailofbits/eth-security-toolbox

# Run container
docker run -it -v $(pwd):/project trailofbits/eth-security-toolbox

# Inside container:
cd /project
slither contracts/Subscription.sol
echidna contracts/Subscription.sol
manticore contracts/Subscription.sol
```

---

## 🚀 Quick Start

### Option 1: Run Full Audit

```bash
# Make script executable (already done)
chmod +x scripts/security-audit.sh

# Run full audit
./scripts/security-audit.sh
```

### Option 2: Manual Testing

```bash
# 1. Slither
slither contracts/Subscription.sol

# 2. Mythril
myth analyze contracts/Subscription.sol

# 3. Solhint
solhint 'contracts/**/*.sol'

# 4. Hardhat tests
npx hardhat test

# 5. Check gas usage
npx hardhat test --gas-report
```

---

## 📊 Expected Output

### Slither Output Example:
```
Reentrancy in Subscription.subscribe(Plan,uint256):
  External calls:
  - (success) = owner.call{value: msg.value}()
  State variables written after the call(s):
  - sub.plan = _plan
```

### Mythril Output Example:
```
==== Unprotected Ether Withdrawal ====
SWC ID: 105
Severity: High
Contract: Subscription
Function name: subscribe(uint8,uint256)
The contract executes an external call without validating caller permissions.
```

---

## 🔧 Troubleshooting

### Slither Installation Issues

```bash
# If you get import errors:
pip3 install --upgrade setuptools wheel

# If solc not found:
pip3 install solc-select
solc-select install 0.8.30
```

### Mythril Installation Issues

```bash
# If you get z3 solver errors:
pip3 install z3-solver

# Ubuntu/Debian dependencies:
sudo apt-get install python3-dev libssl-dev
```

### Echidna Installation Issues

```bash
# On Ubuntu, you might need additional libs:
sudo apt-get install libsecp256k1-dev

# Use Docker as alternative:
docker run -v $(pwd):/src trailofbits/echidna echidna /src/contracts/Subscription.sol
```

---

## 📚 Additional Resources

### Documentation
- [Slither Wiki](https://github.com/crytic/slither/wiki)
- [Mythril Docs](https://mythril-classic.readthedocs.io/)
- [Echidna Tutorial](https://github.com/crytic/building-secure-contracts/tree/master/program-analysis/echidna)
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

### Vulnerability Databases
- [SWC Registry](https://swcregistry.io/) - Smart Contract Weakness Classification
- [Rekt News](https://rekt.news/) - Learn from real hacks
- [DeFi Hack Analysis](https://github.com/SunWeb3Sec/DeFiHackLabs)

### Audit Companies
- Trail of Bits
- OpenZeppelin
- Consensys Diligence
- Certora
- Halborn

---

## ✅ Verification Checklist

After installing tools, verify:

```bash
# Check all installations
echo "Checking installations..."

command -v slither && echo "✓ Slither installed" || echo "✗ Slither missing"
command -v myth && echo "✓ Mythril installed" || echo "✗ Mythril missing"
command -v echidna && echo "✓ Echidna installed" || echo "✗ Echidna missing"
command -v solhint && echo "✓ Solhint installed" || echo "✗ Solhint missing"
command -v npx && echo "✓ Node/NPM installed" || echo "✗ Node/NPM missing"

echo ""
echo "Installation check complete!"
```

---

## 🎯 Next Steps

1. ✅ Install tools (choose Docker for easiest setup)
2. ✅ Run `./scripts/security-audit.sh`
3. ✅ Review reports in `security-reports/` directory
4. ✅ Fix critical issues
5. ✅ Re-run audit to verify fixes
6. ✅ Consider professional audit for mainnet

---

## 💡 Pro Tips

1. **Use Docker** - Easiest way to get all tools at once
2. **Start with Slither** - Fastest and catches most issues
3. **Run Mythril overnight** - Symbolic execution is slow but thorough
4. **Read the reports** - Don't just run tools, understand findings
5. **Test fixes** - Always re-run after making changes
6. **Get a second opinion** - Professional audits are worth it

---

## 🆘 Need Help?

- Trail of Bits Discord: https://discord.gg/trailofbits
- Ethereum Security Community: https://discord.gg/ethereum-security
- Stack Exchange: https://ethereum.stackexchange.com/

---

*Happy auditing! Stay secure! 🔒*
