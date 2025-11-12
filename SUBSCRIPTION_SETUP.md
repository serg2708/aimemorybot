# Subscription System Setup Guide

## Current Status

Your subscription system is now working in **Mock Mode**! 🎉

### What is Mock Mode?

Mock Mode allows you to test the subscription UI and functionality without deploying a smart contract. Subscriptions are saved in the browser's localStorage instead of on the blockchain.

### Features Available in Mock Mode

✅ All subscription UI components work
✅ Subscribe to plans (FREE, BASIC, PRO, UNLIMITED)
✅ Extend subscriptions
✅ Cancel subscriptions
✅ View subscription status
✅ Test the complete user flow

❌ No real blockchain transactions (simulated with delays)
❌ Subscriptions stored locally (cleared on browser cache clear)
❌ No actual payments required

## Testing the System

1. **Open the Pricing Page**
   ```
   http://localhost:3000/pricing
   ```

2. **Connect Your Wallet**
   - Click "Connect Wallet" button
   - Connect to Autonomys Auto EVM (Chronos Testnet or Mainnet)

3. **Check the Debug Panel**
   - Look at the bottom-right corner
   - You should see "⚠️ Mock Mode Active"

4. **Test Subscription Flow**
   - Click "Subscribe" on any paid plan
   - Wait for simulated transaction (2-3 seconds)
   - Page will reload with your new subscription

5. **Verify Subscription**
   - Check the "Current Subscription" card
   - Your plan should be displayed
   - Expiration date should be visible

## Moving to Production (Real Blockchain)

When you're ready to use real blockchain transactions, follow these steps:

### Step 1: Deploy the Smart Contract

See detailed instructions in: [`contracts/DEPLOYMENT.md`](./contracts/DEPLOYMENT.md)

**Quick Deploy via Remix (Recommended):**

1. Go to https://remix.ethereum.org
2. Create file `Subscription.sol`
3. Copy content from `contracts/Subscription.sol`
4. Compile with Solidity 0.8.20+
5. Deploy to:
   - **Testnet**: Chain ID 8700 (Chronos)
   - **Mainnet**: Chain ID 870 (Autonomys)
6. Copy the deployed contract address

### Step 2: Update Environment Variables

Add the contract address to `.env.local`:

```env
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xYourContractAddressHere
```

### Step 3: Restart Your Server

```bash
npm run dev
```

### Step 4: Verify

1. Open `/pricing` page
2. Check debug panel (bottom-right)
3. "Mock Mode" warning should disappear
4. Contract address should be displayed

## Troubleshooting

### Mock Mode Not Working

**Issue**: Subscribe button doesn't work

**Solution**:
1. Check browser console (F12) for errors
2. Verify wallet is connected
3. Clear localStorage and try again
4. Ensure you're on the correct network

### Want to Disable Mock Mode

If you have a contract deployed but want to force mock mode:

Add to `.env.local`:
```env
NEXT_PUBLIC_MOCK_SUBSCRIPTION=true
```

### Switch Back to Real Contract

Remove or set to false:
```env
NEXT_PUBLIC_MOCK_SUBSCRIPTION=false
```

And ensure contract address is set:
```env
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM=0xYourAddress
```

## Understanding the Flow

### Mock Mode Flow

1. User clicks "Subscribe"
2. Function `subscribe()` is called
3. Mock delay simulates transaction (2s)
4. Subscription saved to `localStorage`
5. Mock confirmation delay (1s)
6. Page reloads to show new subscription

### Real Contract Flow

1. User clicks "Subscribe"
2. Function `subscribe()` calls smart contract
3. MetaMask opens for transaction approval
4. User confirms and pays gas + subscription fee
5. Transaction is submitted to blockchain
6. Wait for blockchain confirmation
7. UI updates with new subscription

## Contract Details

- **Contract**: `contracts/Subscription.sol`
- **Version**: Solidity ^0.8.20
- **License**: MIT
- **Networks**:
  - Testnet (Chronos): Chain ID 8700
  - Mainnet: Chain ID 870

### Contract Functions

- `subscribe(plan, duration)` - Subscribe to a plan (payable)
- `extendSubscription(duration)` - Extend subscription (payable)
- `cancelSubscription()` - Cancel subscription
- `getSubscription(address)` - Get subscription data
- `isSubscriptionActive(address)` - Check if active

### Security Features

- ✅ Owner receives payments immediately
- ✅ No funds locked in contract
- ✅ Subscriptions expire automatically
- ✅ Users can cancel anytime
- ✅ No refunds (by design)

## Next Steps

### For Development

1. ✅ Test all subscription flows in Mock Mode
2. ✅ Verify UI/UX works as expected
3. ✅ Test different plans and durations
4. ⏳ Deploy contract when ready
5. ⏳ Update environment variables
6. ⏳ Test with real blockchain transactions

### For Production

1. Deploy contract to **Mainnet** (Chain ID 870)
2. Verify contract on block explorer
3. Test with small amounts first
4. Monitor transactions and errors
5. Set up proper monitoring/alerts
6. Document contract address for users

## Support & Resources

### Documentation

- [Deployment Guide](./contracts/DEPLOYMENT.md) - How to deploy the contract
- [Contract Source](./contracts/Subscription.sol) - Smart contract code
- [Autonomys Docs](https://docs.autonomys.xyz/) - Network documentation

### Block Explorers

- **Testnet**: https://explorer.auto-evm.chronos.autonomys.xyz
- **Mainnet**: https://explorer.mainnet.autonomys.xyz

### RPC Endpoints

- **Testnet**: https://rpc-0.chronos.autonomys.xyz
- **Mainnet**: https://auto-evm.mainnet.autonomys.xyz

### Need Help?

1. Check the debug panel on `/pricing` page
2. Look at browser console for errors
3. Review the deployment guide
4. Check network configuration

## Status Indicators

The debug panel shows:

- 🟢 **Green** - Working correctly
- 🟡 **Orange/Yellow** - Warning (Mock Mode, not critical)
- 🔴 **Red** - Error (needs attention)

Look for these in the debug panel:
- Wallet Connection
- Network Status
- Contract Address
- Subscription Status
- Mock Mode Indicator

---

**Current Mode**: Mock Mode (No contract deployed)
**Status**: ✅ Fully functional for testing
**Next Action**: Test the subscription flow on `/pricing` page
