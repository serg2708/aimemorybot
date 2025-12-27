/**
 * Autonomys Auto Drive integration for decentralized storage
 * Provides persistent, blockchain-backed storage for chat history
 */

import type { AutoDriveApi } from "@autonomys/auto-drive";
import { DSNError, handleError, retryDSNOperation } from "./error-handling";
import {
  notifyAPIKeyMissing,
  notifyDSNConnected,
  notifyFileDownloaded,
  notifyFileDownloading,
  notifyFileUploaded,
} from "./notifications";

// Cache the AutoDrive instance
let autoDriveInstance: AutoDriveApi | null = null;

/**
 * Configuration for Autonomys DSN
 *
 * IMPORTANT: Auto Drive currently only supports MAINNET
 * - Taurus testnet was shut down on September 12, 2025
 * - Chronos testnet is not yet supported by Auto Drive API
 * - For now, all uploads go to Mainnet regardless of AUTONOMYS_NETWORK setting
 *
 * Get your API key from: https://ai3.storage/
 * - Sign in with Google, Discord, or GitHub
 * - Navigate to Developers → Create API Key
 * - Free tier: 20MB/month upload limit
 */
export const AUTONOMYS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_AUTONOMYS_API_KEY,
  networkName: "mainnet" as const,
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
    if (typeof window === "undefined") {
      console.warn("AutoDrive is only available in browser environment");
      return null;
    }

    // Check if API key is available
    if (!AUTONOMYS_CONFIG.apiKey) {
      console.warn("NEXT_PUBLIC_AUTONOMYS_API_KEY is not configured");
      return null;
    }

    // Dynamically import AutoDrive to avoid SSR issues
    const { createAutoDriveApi } = await import("@autonomys/auto-drive");

    // Initialize AutoDrive
    autoDriveInstance = createAutoDriveApi({
      apiKey: AUTONOMYS_CONFIG.apiKey,
      network: AUTONOMYS_CONFIG.networkName,
    });

    console.log("AutoDrive initialized successfully");
    return autoDriveInstance;
  } catch (error) {
    console.error("Failed to initialize AutoDrive:", error);
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
      if (!AUTONOMYS_CONFIG.apiKey) {
        notifyAPIKeyMissing();
      }
      throw new DSNError("AutoDrive not initialized");
    }

    // Upload with retry logic
    const cid = await retryDSNOperation(async () => {
      // Prepare data with metadata
      const dataWithMetadata = {
        data,
        metadata: metadata || {},
      };

      // Convert to buffer
      const buffer = Buffer.from(JSON.stringify(dataWithMetadata));

      // Upload to AutoDrive
      return await autoDrive.uploadFileFromBuffer(buffer, "messages.json", {
        compression: true,
      });
    }, "Upload to AutoDrive");

    console.log("Uploaded to AutoDrive:", cid);
    notifyFileUploaded(cid);
    return cid;
  } catch (error) {
    handleError(error, "Uploading to AutoDrive");
    return null;
  }
}

/**
 * Download data from Autonomys DSN using CID
 */
export async function downloadFromAutoDrive(
  cid: string
): Promise<string | null> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      if (!AUTONOMYS_CONFIG.apiKey) {
        notifyAPIKeyMissing();
      }
      throw new DSNError("AutoDrive not initialized", cid);
    }

    notifyFileDownloading(cid);

    // Download with retry logic
    const data = await retryDSNOperation(async () => {
      // Download file by CID as a stream
      const stream = await autoDrive.downloadFile(cid);

      // Collect chunks into buffer
      let file = Buffer.alloc(0);
      for await (const chunk of stream) {
        file = Buffer.concat([file, chunk]);
      }

      // Convert buffer to string and parse JSON
      const text = file.toString("utf-8");
      const parsedData = JSON.parse(text);

      return parsedData.data || text;
    }, "Download from AutoDrive");

    console.log("Downloaded from AutoDrive:", cid);
    notifyFileDownloaded(cid);
    return data;
  } catch (error) {
    handleError(error, "Downloading from AutoDrive");
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
      throw new Error("AutoDrive not initialized");
    }

    // Get files from AutoDrive (page 0, limit 100)
    const result = await autoDrive.getMyFiles(0, 100);

    // Extract rows from paginated result
    const files = result.rows || [];

    // Filter by address in metadata if possible
    // Note: Filtering may need to be done client-side or via metadata stored with file
    return files;
  } catch (error) {
    console.error("Failed to list user files:", error);
    return [];
  }
}

/**
 * Delete a file from AutoDrive by CID
 * Note: Deletion may not be supported by the current API
 */
export async function deleteFromAutoDrive(cid: string): Promise<boolean> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      throw new Error("AutoDrive not initialized");
    }

    // Note: Delete functionality may not be available in current AutoDrive API
    // Files on blockchain are typically immutable
    console.warn("Delete operation not supported by AutoDrive API");
    return false;
  } catch (error) {
    console.error("Failed to delete from AutoDrive:", error);
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
    console.error("Failed to get storage stats:", error);
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
  network: string;
  apiKeyConfigured: boolean;
}> {
  const connected = await isAutoDriveAvailable();
  return {
    connected,
    network: "mainnet",
    apiKeyConfigured: !!AUTONOMYS_CONFIG.apiKey,
  };
}
