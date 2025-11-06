/**
 * Autonomys Auto Drive integration for decentralized storage
 * Provides persistent, blockchain-backed storage for chat history
 */

import { AutoDriveApi } from '@autonomys/auto-drive';

// Cache the AutoDrive instance
let autoDriveInstance: AutoDriveApi | null = null;

/**
 * Configuration for Autonomys DSN
 */
export const AUTONOMYS_CONFIG = {
  rpcUrl: process.env.NEXT_PUBLIC_AUTONOMYS_RPC_URL || 'wss://rpc-chronos.autonomys.xyz',
  chainId: process.env.NEXT_PUBLIC_AUTONOMYS_CHAIN_ID || '490000',
};

/**
 * Initialize AutoDrive instance
 */
export async function getAutoDrive(): Promise<AutoDriveApi | null> {
  // Return cached instance if available
  if (autoDriveInstance) {
    return autoDriveInstance;
  }

  try {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      console.warn('AutoDrive is only available in browser environment');
      return null;
    }

    // Initialize AutoDrive
    // @ts-ignore - AutoDriveApi.new signature may vary
    autoDriveInstance = await AutoDriveApi.new({
      apiKey: process.env.NEXT_PUBLIC_AUTONOMYS_API_KEY,
    });

    console.log('AutoDrive initialized successfully');
    return autoDriveInstance;
  } catch (error) {
    console.error('Failed to initialize AutoDrive:', error);
    return null;
  }
}

/**
 * Upload data to Autonomys DSN
 * Returns CID (Content Identifier) of uploaded data
 */
export async function uploadToAutoDrive(
  data: string,
  metadata?: {
    address?: string;
    timestamp?: number;
    messageCount?: number;
  }
): Promise<string | null> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      throw new Error('AutoDrive not initialized');
    }

    // Create a blob from the data
    const blob = new Blob([data], { type: 'application/json' });
    const file = new File([blob], 'messages.json', { type: 'application/json' });

    // Upload to AutoDrive
    const result = await autoDrive.uploadFile(file, {
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    console.log('Uploaded to AutoDrive:', result.cid);
    return result.cid;
  } catch (error) {
    console.error('Failed to upload to AutoDrive:', error);
    return null;
  }
}

/**
 * Download data from Autonomys DSN using CID
 */
export async function downloadFromAutoDrive(cid: string): Promise<string | null> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      throw new Error('AutoDrive not initialized');
    }

    // Download file by CID
    const file = await autoDrive.downloadFile(cid);

    // Read file content
    const text = await file.text();
    console.log('Downloaded from AutoDrive:', cid);
    return text;
  } catch (error) {
    console.error('Failed to download from AutoDrive:', error);
    return null;
  }
}

/**
 * List all files uploaded by a specific address
 */
export async function listUserFiles(address: string): Promise<any[]> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      throw new Error('AutoDrive not initialized');
    }

    // List files - this might need to be filtered by metadata
    const files = await autoDrive.listFiles();

    // Filter by address in metadata
    return files.filter((file: any) => {
      try {
        const metadata = JSON.parse(file.metadata || '{}');
        return metadata.address === address;
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.error('Failed to list user files:', error);
    return [];
  }
}

/**
 * Delete a file from AutoDrive by CID
 */
export async function deleteFromAutoDrive(cid: string): Promise<boolean> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      throw new Error('AutoDrive not initialized');
    }

    await autoDrive.deleteFile(cid);
    console.log('Deleted from AutoDrive:', cid);
    return true;
  } catch (error) {
    console.error('Failed to delete from AutoDrive:', error);
    return false;
  }
}

/**
 * Get storage statistics for a user
 */
export async function getStorageStats(address: string): Promise<{
  fileCount: number;
  totalSize: number;
  lastUpdated?: number;
}> {
  try {
    const files = await listUserFiles(address);

    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const lastUpdated = files.reduce(
      (latest, file) => Math.max(latest, file.timestamp || 0),
      0
    );

    return {
      fileCount: files.length,
      totalSize,
      lastUpdated: lastUpdated || undefined,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      fileCount: 0,
      totalSize: 0,
    };
  }
}

/**
 * Check if AutoDrive is available and connected
 */
export async function isAutoDriveAvailable(): Promise<boolean> {
  try {
    const autoDrive = await getAutoDrive();
    return autoDrive !== null;
  } catch {
    return false;
  }
}

/**
 * Get AutoDrive connection status
 */
export async function getAutoDriveStatus(): Promise<{
  connected: boolean;
  rpcUrl: string;
  chainId: string;
}> {
  const connected = await isAutoDriveAvailable();
  return {
    connected,
    rpcUrl: AUTONOMYS_CONFIG.rpcUrl,
    chainId: AUTONOMYS_CONFIG.chainId,
  };
}
