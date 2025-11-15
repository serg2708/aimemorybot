# Auto Drive Integration Guide

This guide explains how to set up and use Autonomys Auto Drive for decentralized chat storage in AI Memory Box.

## What is Auto Drive?

Auto Drive is Autonomys Network's decentralized storage solution (DSN - Decentralized Storage Network). It provides:

- **Permanent storage** on the Autonomys blockchain
- **Content addressing** via CID (Content Identifier), similar to IPFS
- **Decentralized** and censorship-resistant storage
- **TypeScript SDK** for easy integration

## Current Status

⚠️ **Important Network Information:**

- **Auto Drive currently ONLY supports MAINNET**
- Taurus testnet was shut down on September 12, 2025
- Chronos testnet is not yet supported by Auto Drive API
- All chat storage goes to mainnet regardless of your `AUTONOMYS_NETWORK` setting

The `NEXT_PUBLIC_AUTONOMYS_NETWORK` variable only affects blockchain operations (payments, contracts), not storage.

## Setup Instructions

### 1. Get Your Free API Key

1. Visit **https://ai3.storage/**
2. Sign in using one of these methods:
   - Google
   - Discord
   - GitHub
   - Wallet authentication

3. Navigate to the **"developers"** section in the left sidebar
4. Click **"Create API Key"**
5. Copy your new API key

**Free Tier Limits:** 20MB/month upload quota

### 2. Configure Environment Variables

Add your API key to your `.env.local` file:

```bash
# Auto Drive Configuration
NEXT_PUBLIC_AUTONOMYS_API_KEY=your_api_key_here
```

### 3. Verify Installation

The required packages are already installed:

```json
{
  "@autonomys/auto-drive": "^1.6.0",
  "@autonomys/auto-utils": "^1.6.0"
}
```

If you need to install them manually:

```bash
pnpm add @autonomys/auto-drive @autonomys/auto-utils
```

## How It Works

### Automatic Chat Backup

The system automatically backs up your chat history to Auto Drive:

1. **Local Storage First:** Chats are saved to browser localStorage immediately
2. **Debounced Upload:** After 5 seconds of inactivity, chats are uploaded to Auto Drive
3. **Background Sync:** Every 60 seconds, all modified chats are synced to DSN
4. **CID Tracking:** Each upload receives a unique CID (Content Identifier)

### File Structure

```typescript
// lib/auto-drive.ts - Core Auto Drive integration
export async function uploadToAutoDrive(data: string, metadata?: {...}): Promise<string | null>
export async function downloadFromAutoDrive(cid: string): Promise<string | null>

// lib/chat-persistence.ts - Chat-specific persistence layer
export async function saveChatToDSN(chatId: string, address?: string): Promise<string | null>
export async function loadChatFromDSN(cid: string, address?: string): Promise<ChatSession | null>
```

## Usage Examples

### Manual Upload

```typescript
import { saveChatToDSN } from '@/lib/chat-persistence';

// Save a specific chat to Auto Drive
const chatId = 'chat-123';
const address = '0x...'; // Optional: for encryption
const cid = await saveChatToDSN(chatId, address);

console.log('Uploaded to Auto Drive, CID:', cid);
```

### Manual Download

```typescript
import { loadChatFromDSN } from '@/lib/chat-persistence';

// Load a chat from Auto Drive by CID
const cid = 'bafk...'; // CID from previous upload
const address = '0x...'; // Optional: for decryption
const chat = await loadChatFromDSN(cid, address);

console.log('Downloaded chat:', chat);
```

### Get Storage Statistics

```typescript
import { getStorageStats } from '@/lib/auto-drive';

const stats = await getStorageStats(userAddress);
console.log(`Files: ${stats.fileCount}, Total Size: ${stats.totalSize} bytes`);
```

### Check Connection Status

```typescript
import { getAutoDriveStatus } from '@/lib/auto-drive';

const status = await getAutoDriveStatus();
console.log('Auto Drive Status:', status);
// {
//   connected: true,
//   network: 'mainnet',
//   apiKeyConfigured: true
// }
```

## Features

### ✅ Implemented

- [x] Automatic chat backup with debouncing
- [x] Upload/download with retry logic
- [x] CID mapping and tracking
- [x] Encryption support (when address provided)
- [x] Error handling and notifications
- [x] Storage statistics
- [x] Background sync
- [x] Local + DSN dual storage

### 🚧 Limitations

- [ ] Auto Drive only supports mainnet (no testnet)
- [ ] File deletion not supported (blockchain immutability)
- [ ] 20MB/month upload quota on free tier

## API Reference

### Core Functions

#### `uploadToAutoDrive(data, metadata?)`

Uploads data to Auto Drive and returns a CID.

```typescript
const cid = await uploadToAutoDrive(
  JSON.stringify(chatData),
  {
    address: '0x...',
    timestamp: Date.now(),
    messageCount: 42
  }
);
```

#### `downloadFromAutoDrive(cid)`

Downloads data from Auto Drive by CID.

```typescript
const data = await downloadFromAutoDrive('bafk...');
```

#### `listUserFiles(address)`

Lists all files uploaded by a user.

```typescript
const files = await listUserFiles('0x...');
```

#### `isAutoDriveAvailable()`

Checks if Auto Drive is properly configured.

```typescript
const available = await isAutoDriveAvailable();
```

## Configuration Options

```typescript
// In lib/chat-persistence.ts
const AUTO_SAVE_CONFIG = {
  enabled: true,
  debounceMs: 5000,        // Save 5 seconds after last change
  syncIntervalMs: 60000,   // Sync every minute
};
```

## Dashboard Access

Visit **https://ai3.storage/** to:

- View all uploaded files
- Download files by CID
- Share files with others
- Monitor upload/download quotas
- Manage API keys

## Troubleshooting

### "AutoDrive not initialized" error

**Solution:** Check that `NEXT_PUBLIC_AUTONOMYS_API_KEY` is set in your `.env.local` file.

### "Failed to upload to DSN" error

**Solutions:**
1. Verify your API key is valid
2. Check that you haven't exceeded the 20MB/month quota
3. Ensure file size is reasonable (compress large chats)
4. Check network connectivity

### Uploads work but downloads fail

**Solution:** Verify the CID is correct and the file was successfully uploaded. Check the dashboard at ai3.storage.

## Network Information

### Mainnet (Production)
- **Network ID:** `NetworkId.MAINNET`
- **API Endpoint:** `https://mainnet.auto-drive.autonomys.xyz/api`
- **Download Service:** `https://public.auto-drive.autonomys.xyz/api`
- **Token:** AI3
- **Dashboard:** https://ai3.storage/

### Testnet (Not Available)
- Taurus testnet: Shut down September 12, 2025
- Chronos testnet: Not yet supported by Auto Drive
- Use mainnet for all storage operations

## Security

### Encryption

When a wallet address is provided, the system automatically encrypts chat data before upload:

```typescript
// Automatic encryption when address provided
await saveChatToDSN(chatId, userAddress); // Encrypted
await saveChatToDSN(chatId);              // Unencrypted
```

### Privacy Considerations

- Files uploaded to Auto Drive are **public by default** unless encrypted
- CIDs are deterministic (same content = same CID)
- Always encrypt sensitive data before upload
- The free tier has limited quota - monitor usage

## Support

- **Documentation:** https://docs.autonomys.xyz/
- **Developer Docs:** https://develop.autonomys.xyz/sdk/auto-drive/overview_setup
- **Dashboard:** https://ai3.storage/
- **GitHub:** https://github.com/autonomys/auto-sdk

## Version Information

- **@autonomys/auto-drive:** ^1.6.0
- **@autonomys/auto-utils:** ^1.6.0
- **Supported Networks:** Mainnet only
- **Last Updated:** January 2025
