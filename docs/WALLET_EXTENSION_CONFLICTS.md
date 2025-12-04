# Wallet Extension Conflicts - Known Issues & Solutions

## Problem Overview

When multiple wallet browser extensions are installed (MetaMask, Nightly, Talisman, Coinbase Wallet, etc.), they all attempt to inject their own `window.ethereum` provider, causing conflicts.

## Errors You Might See

```
TypeError: Cannot set property ethereum of #<Window> which has only a getter
```

```
Unable to redefine window.ethereum
```

```
Failed to assign ethereum proxy
```

## Root Causes

### 1. Multiple Wallet Extensions Conflict
- Each wallet extension tries to set `window.ethereum`
- Once one extension sets it, others fail trying to override
- This is a known browser extension limitation

### 2. Talisman Library SSR Issues
- `@talismn/connect-wallets` library had issues with Server-Side Rendering (SSR)
- Static imports caused "Class extends undefined" errors during build
- **Solution**: Changed to dynamic imports (lazy loading)

### 3. ProseMirror and Other Libraries
- Some libraries don't work well with SSR in Next.js
- Need proper `"use client"` directives and dynamic imports

## Solutions Implemented

### 1. Dynamic Import for Talisman Wallet
**File**: `components/polkadot-wallet-connect.tsx`

Changed from:
```typescript
import { getWallets } from '@talismn/connect-wallets';
```

To:
```typescript
const { getWallets } = await import('@talismn/connect-wallets');
```

This ensures the library only loads on the client-side when needed.

### 2. Webpack Configuration
**File**: `next.config.ts`

Added:
- Fallback configurations for Node.js modules
- Warning suppressions for known wallet conflicts
- Better handling of external dependencies

### 3. Client-Side Only Components
All wallet-related components use `"use client"` directive to ensure they only run in the browser.

## Best Practices

### For Users:
1. **Disable unused wallet extensions** to reduce conflicts
2. Use **one primary wallet** for the application
3. If multiple wallets are needed, ensure only one is active at a time

### For Developers:
1. Always use **dynamic imports** for wallet libraries
2. Add `"use client"` directive to all Web3 components
3. Handle wallet connection errors gracefully
4. Test with multiple wallet extensions installed

## Expected Behavior

After fixes:
- ✅ Console warnings about wallet conflicts are suppressed
- ✅ Application loads without "Class extends undefined" errors
- ✅ Wallet connections work properly
- ✅ No critical runtime errors

The wallet extension warnings are cosmetic and don't affect functionality.

## Testing

To verify fixes:
```bash
# Clean build
rm -rf .next
pnpm build

# Run development server
pnpm dev
```

## Related Files

- `components/polkadot-wallet-connect.tsx` - Polkadot wallet connector
- `components/wallet-connect.tsx` - RainbowKit EVM wallet connector
- `components/providers.tsx` - Web3 providers wrapper
- `lib/web3.ts` - Web3 configuration
- `next.config.ts` - Next.js and webpack configuration

## Further Reading

- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Talisman Connect](https://github.com/TalismanSociety/talisman-connect)
