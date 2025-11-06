# AI Memory Box - Autonomys Integration

Complete guide for AI Memory Box with blockchain-powered permanent storage.

## 🚀 Features

- **Permanent Blockchain Storage**: Chat history stored on Autonomys DSN
- **End-to-End Encryption**: All conversations encrypted with your wallet
- **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, Base, Optimism
- **Crypto Payments**: Subscribe with ETH, USDC, or USDT
- **Web3 Wallets**: Support for MetaMask, Coinbase Wallet, WalletConnect, and Polkadot wallets
- **Subscription Tiers**: Free, Basic, Pro, and Unlimited plans

## 📋 Prerequisites

1. Node.js 18+ and pnpm
2. A WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com))
3. API keys for AI Gateway or Anthropic/OpenAI
4. (Optional) Deployed subscription smart contracts

## 🛠️ Installation

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

#### Required Variables:

```env
# Authentication
AUTH_SECRET=your_random_secret_here

# AI Gateway (for Vercel deployments, OIDC is automatic)
AI_GATEWAY_API_KEY=your_ai_gateway_key

# WalletConnect - REQUIRED for wallet connections
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Database
POSTGRES_URL=your_postgres_url
BLOB_READ_WRITE_TOKEN=your_blob_token

# Optional: Redis for resumable streams
REDIS_URL=your_redis_url
```

#### Optional Autonomys Variables:

```env
# Autonomys Configuration (defaults provided)
NEXT_PUBLIC_AUTONOMYS_RPC_URL=wss://rpc-chronos.autonomys.xyz
NEXT_PUBLIC_AUTONOMYS_CHAIN_ID=490000
NEXT_PUBLIC_AUTONOMYS_API_KEY=your_autodrive_api_key

# Smart Contract Addresses (if you deployed contracts)
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_MAINNET=0x...
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_POLYGON=0x...
NEXT_PUBLIC_PAYMENT_RECIPIENT=0x...
```

### 3. Database Setup

```bash
pnpm db:migrate
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎨 Architecture

### Storage Layer

```
User Message → Encryption → Autonomys DSN → CID Storage
              (with wallet)   (blockchain)   (localStorage fallback)
```

**Libraries:**
- `lib/encryption.ts` - Client-side AES-GCM encryption
- `lib/auto-drive.ts` - Autonomys AutoDrive integration
- `lib/memory-storage.ts` - Unified storage API

### Subscription System

```
User → Connect Wallet → Select Plan → Pay with Crypto → Smart Contract
                                                        ↓
                                                 Subscription Active
```

**Libraries:**
- `lib/contract.ts` - Smart contract ABIs and interactions
- `lib/subscription.ts` - Client-side subscription hooks
- `lib/subscription-server.ts` - Server-side verification
- `lib/payment.ts` - Payment processing

### Components

**Wallet:**
- `components/wallet-connect.tsx` - EVM wallet connection (RainbowKit)
- `components/polkadot-wallet-connect.tsx` - Polkadot/Substrate wallets

**UI:**
- `components/subscription-badge.tsx` - Display subscription tier
- `components/storage-status.tsx` - Show DSN storage status

**Pages:**
- `app/pricing/page.tsx` - Subscription plans and payment
- `app/(chat)/page.tsx` - Main chat interface (existing)

## 🔐 Security

### Encryption

All messages are encrypted using:
- **Algorithm**: AES-GCM (256-bit)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Password**: Deterministic from wallet address

```typescript
// Example usage
import { encryptMessages, decryptMessages } from '@/lib/encryption';

// Encrypt
const encrypted = await encryptMessages(messages, walletAddress);

// Decrypt
const decrypted = await decryptMessages(encrypted, walletAddress);
```

### Access Control

- Only the wallet owner can decrypt their data
- No server-side access to encrypted content
- CID (Content Identifier) stored locally for retrieval

## 🎯 Usage Examples

### Save Messages to Autonomys

```typescript
import { saveMessages } from '@/lib/memory-storage';
import { useAccount } from 'wagmi';

const { address } = useAccount();

// Save encrypted messages to DSN
const cid = await saveMessages(address, messages, {
  encrypted: true,
  useDSN: true,
  fallbackToLocal: true,
});

console.log('Saved to blockchain with CID:', cid);
```

### Load Messages from Autonomys

```typescript
import { loadMessages } from '@/lib/memory-storage';

// Load by CID or from local cache
const messages = await loadMessages(address, cid, {
  encrypted: true,
  useDSN: true,
  fallbackToLocal: true,
});
```

### Check Subscription Status

```typescript
import { useSubscription } from '@/lib/subscription';

function MyComponent() {
  const { subscription, isActive, daysLeft } = useSubscription();

  return (
    <div>
      Plan: {subscription?.plan}
      Active: {isActive ? 'Yes' : 'No'}
      Days Left: {daysLeft}
    </div>
  );
}
```

### Subscribe to a Plan

```typescript
import { useSubscribe } from '@/lib/subscription';
import { SubscriptionPlan } from '@/lib/contract';

function SubscribeButton() {
  const { subscribe, isPending } = useSubscribe();

  const handleSubscribe = async () => {
    await subscribe(
      SubscriptionPlan.PRO,
      'monthly',
      parseEther('0.01') // Amount in wei
    );
  };

  return (
    <button onClick={handleSubscribe} disabled={isPending}>
      {isPending ? 'Processing...' : 'Subscribe'}
    </button>
  );
}
```

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy!

### Environment Variables Required in Production:

- `AUTH_SECRET`
- `AI_GATEWAY_API_KEY` (or OIDC on Vercel)
- `POSTGRES_URL`
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_PAYMENT_RECIPIENT`

### Smart Contract Deployment

Deploy subscription contracts to desired chains:

```solidity
// See contracts/ directory for example implementation
// Deploy with Hardhat or Foundry
```

## 📊 Subscription Plans

| Plan | Messages/Day | Storage | History | Price |
|------|-------------|---------|---------|-------|
| Free | 10 | 1 MB | 7 days | $0 |
| Basic | 100 | 100 MB | 30 days | $9.99/mo |
| Pro | 1,000 | 1 GB | Unlimited | $19.99/mo |
| Unlimited | ∞ | 10 GB | Unlimited | $49.99/mo |

## 🔧 Configuration

### Customize Subscription Plans

Edit `lib/contract.ts`:

```typescript
export const PLAN_PRICES = {
  [SubscriptionPlan.BASIC]: { monthly: 9.99, yearly: 99.99 },
  // ... add your pricing
};

export const PLAN_FEATURES = {
  [SubscriptionPlan.BASIC]: {
    messages: 100,
    storage: '100 MB',
    // ... add your features
  },
};
```

### Customize Supported Chains

Edit `lib/web3.ts`:

```typescript
import { yourChain } from 'wagmi/chains';

export const getWeb3Config = () => {
  return getDefaultConfig({
    chains: [
      mainnet,
      polygon,
      yourChain, // Add your chain
    ],
  });
};
```

## 🐛 Troubleshooting

### "AutoDrive not initialized"

- Check `NEXT_PUBLIC_AUTONOMYS_RPC_URL` is set
- Ensure browser environment (AutoDrive is client-only)
- Check console for connection errors

### "Failed to connect wallet"

- Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
- Check wallet extension is installed and unlocked
- Try refreshing the page

### "Subscription contract not available"

- Deploy subscription contracts to your target chains
- Set contract addresses in environment variables
- Or use testnet contracts for development

## 📚 Learn More

- [Autonomys Documentation](https://docs.autonomys.xyz)
- [AutoDrive SDK](https://github.com/autonomys/auto-sdk)
- [RainbowKit Documentation](https://rainbowkit.com)
- [wagmi Documentation](https://wagmi.sh)
- [Vercel AI SDK](https://sdk.vercel.ai)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

- GitHub Issues: [Create an issue](https://github.com/yourusername/aimemorybox/issues)
- Discord: [Join our community](https://discord.gg/autonomys)
- Email: support@aimemorybox.com

---

Built with ❤️ using Next.js, Autonomys, and Web3
