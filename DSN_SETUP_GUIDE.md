# 🗄️ Autonomys DSN Setup Guide

## What is Autonomys DSN?

**Autonomys Decentralized Storage Network (DSN)** is a decentralized storage solution that allows you to store chat history and files permanently on the blockchain.

### Benefits:
- ✅ **Permanent storage** - Your data never disappears
- ✅ **Decentralized** - No single point of failure
- ✅ **Censorship-resistant** - Your data belongs to you
- ✅ **Automatic backup** - Chats saved to DSN are always recoverable

---

## Current Status

**Storage Status on Dashboard shows "Disconnected"?**

This is **normal** if you haven't configured DSN yet. The app works perfectly without DSN:
- ✅ Chats are stored **locally in your browser**
- ✅ All features work normally
- ✅ You can export/import your data manually

**DSN is optional** - it provides additional decentralized backup.

---

## How to Enable DSN Storage

### Step 1: Get an Autonomys API Key

1. **Visit Autonomys website:**
   - Go to https://autonomys.xyz
   - Or https://docs.autonomys.xyz

2. **Register for API access:**
   - Sign up for a developer account
   - Request API key for DSN access
   - You may need to join their Discord/Telegram for early access

3. **Copy your API key** when you receive it

### Step 2: Add API Key to Your App

1. **Create/edit `.env.local` file** in the project root:
   ```bash
   # Autonomys DSN Configuration
   NEXT_PUBLIC_AUTONOMYS_API_KEY=your_api_key_here
   ```

2. **Example:**
   ```bash
   NEXT_PUBLIC_AUTONOMYS_API_KEY=ak_1234567890abcdef
   ```

### Step 3: Deploy or Restart

**For local development:**
```bash
pnpm dev
```

**For Vercel deployment:**
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add new variable:
   - **Name:** `NEXT_PUBLIC_AUTONOMYS_API_KEY`
   - **Value:** Your API key
   - **Environment:** Production, Preview, Development
4. Click **Save**
5. Redeploy your app

---

## Verifying DSN Connection

After adding the API key:

1. **Check Dashboard:**
   - Go to `/dashboard`
   - Look at **Storage Status** card
   - Should show "Connected" with green indicator

2. **Check Console:**
   ```
   ✓ AutoDrive initialized successfully
   ✓ DSN: Connected
   ```

3. **Test storage:**
   - Create a new chat
   - Messages should automatically save to DSN
   - Check console for upload confirmations

---

## How DSN Works in This App

### Automatic Backup:
- ✅ Every chat message is automatically backed up to DSN
- ✅ Files uploaded in chat are stored on DSN
- ✅ Chat metadata (title, date, model used) is saved

### Storage Structure:
```
DSN Storage
├── chats/
│   ├── chat-id-1.json
│   ├── chat-id-2.json
│   └── ...
└── files/
    ├── file-hash-1
    ├── file-hash-2
    └── ...
```

### Recovery:
- If you clear browser data, chats can be recovered from DSN
- Connect your wallet on any device to access your chats
- Your wallet address is used as the encryption key

---

## Troubleshooting

### "Disconnected" Status After Adding API Key

**Check these:**

1. **API key is valid:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_AUTONOMYS_API_KEY=ak_your_real_key_here
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for AutoDrive errors
   - Common issues:
     - Invalid API key format
     - Network connectivity issues
     - API key not activated yet

### "AutoDrive initialization failed"

**Possible causes:**

1. **API key not set:**
   ```
   NEXT_PUBLIC_AUTONOMYS_API_KEY is not configured
   ```
   **Solution:** Add the API key to `.env.local`

2. **SSR loading error:**
   ```
   AutoDrive is only available in browser environment
   ```
   **This is normal** - AutoDrive only works client-side

3. **Network issues:**
   - Check internet connection
   - Verify Autonomys network status
   - Try again in a few minutes

### Storage shows "None"

This means:
- DSN is not connected, OR
- No files have been uploaded yet

**Files are uploaded when:**
- You attach files to chat messages
- You explicitly save chats to DSN

---

## Network Configuration

### Mainnet vs Testnet

The app can connect to either network:

**Testnet (Chronos):**
```bash
NEXT_PUBLIC_AUTONOMYS_NETWORK=testnet
```
- For testing and development
- Uses tAI3 token (free testnet tokens)

**Mainnet:**
```bash
NEXT_PUBLIC_AUTONOMYS_NETWORK=mainnet
```
- Production environment
- Uses AI3 token (real value)

**Default:** Mainnet (if not specified)

---

## Costs

### DSN Storage Pricing

**Current status:** Check with Autonomys team for latest pricing

**Typical model:**
- Pay per GB stored
- One-time payment for permanent storage
- Or subscription-based pricing

**Free tier:** May be available for early adopters/testnet

### How Payments Work

1. **Upload file/chat to DSN**
2. **Calculate storage cost** (based on data size)
3. **Pay in AI3 tokens** (automatically from your wallet)
4. **Data stored permanently** on DSN

---

## FAQ

### Q: Do I need DSN to use the app?

**No!** The app works perfectly without DSN. Chats are stored locally in your browser.

### Q: What happens if I don't have an API key?

Storage features are disabled, but everything else works:
- ✅ Chat with AI models
- ✅ Save locally in browser
- ✅ Export/import data manually
- ✅ Subscription payments work

### Q: Can I switch from local to DSN storage later?

**Yes!** When you add the API key:
1. Existing local chats remain in browser
2. New chats will be saved to DSN
3. You can manually export local chats and import them to DSN

### Q: Is my data private on DSN?

**Yes!**
- Data is encrypted with your wallet's private key
- Only you can decrypt and read your chats
- Even Autonomys cannot read your data

### Q: What if I lose my wallet/seed phrase?

**Important:**
- If you lose wallet access, you **cannot decrypt** DSN data
- Always backup your seed phrase securely
- Consider exporting chats as JSON backup

---

## Advanced: Manual DSN Operations

### Export All Chats to DSN

```typescript
// In browser console or code
import { exportAllToDSN } from '@/lib/memory-storage';

await exportAllToDSN();
```

### Import Chats from DSN

```typescript
import { importFromDSN } from '@/lib/memory-storage';

const chats = await importFromDSN(walletAddress);
```

### Check DSN Connection Status

```typescript
import { getAutoDriveStatus } from '@/lib/auto-drive-client';

const status = await getAutoDriveStatus();
console.log(status);
// { isConnected: true, network: 'mainnet' }
```

---

## Getting Help

### Resources:

1. **Autonomys Documentation:**
   - https://docs.autonomys.xyz
   - https://academy.autonomys.xyz

2. **Community:**
   - Discord: https://discord.gg/autonomys
   - Telegram: https://t.me/autonomysnetwork
   - Forum: https://forum.autonomys.xyz

3. **GitHub Issues:**
   - Report bugs: https://github.com/serg2708/aimemorybot/issues
   - Request features: Same link above

### Common Support Requests:

**"How do I get an API key?"**
→ Contact Autonomys team via Discord/Telegram

**"DSN not connecting"**
→ Check API key format and network connectivity

**"Where is my data stored?"**
→ Locally (browser) until DSN is configured

---

## Summary

### Quick Setup Checklist:

- [ ] Get Autonomys API key
- [ ] Add to `.env.local`: `NEXT_PUBLIC_AUTONOMYS_API_KEY=your_key`
- [ ] Restart dev server or redeploy
- [ ] Check Dashboard → Storage Status
- [ ] Verify "Connected" status
- [ ] Test by creating a chat

### Without DSN:

✅ App works fully
✅ Local storage active
✅ Manual export/import available

### With DSN:

✅ Everything above, PLUS:
✅ Automatic cloud backup
✅ Multi-device access
✅ Permanent storage
✅ Decentralized & censorship-resistant

---

**Last Updated:** 2025-12-29
**Version:** 1.0.0
**Network:** AutoEVM Mainnet / Testnet (Chronos)
