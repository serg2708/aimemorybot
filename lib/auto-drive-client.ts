/**
 * Client-side only AutoDrive wrapper
 * This file ensures AutoDrive is NEVER loaded on server
 */

"use client";

// Use dynamic type to avoid importing from @autonomys/auto-drive at module level
type AutoDriveApi = any;

import { DSNError, handleError, retryDSNOperation } from "./error-handling";
import {
  notifyAPIKeyMissing,
  notifyFileDownloaded,
  notifyFileDownloading,
  notifyFileUploaded,
} from "./notifications";

// Cache the AutoDrive instance
let autoDriveInstance: AutoDriveApi | null = null;
let initPromise: Promise<AutoDriveApi | null> | null = null;
let initFailed = false; // Track if initialization has failed

/**
 * Configuration for Autonomys DSN
 */
export const AUTONOMYS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_AUTONOMYS_API_KEY,
  networkName: "mainnet" as const,
};

/**
 * Initialize AutoDrive instance (browser only)
 */
export async function getAutoDrive(): Promise<AutoDriveApi | null> {
  // Return cached instance if available
  if (autoDriveInstance) {
    return autoDriveInstance;
  }

  // Don't retry if initialization already failed
  if (initFailed) {
    return null;
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Check if we're in the browser
  if (typeof window === "undefined") {
    console.warn("AutoDrive is only available in browser environment");
    return null;
  }

  // Check if API key is available
  if (!AUTONOMYS_CONFIG.apiKey) {
    console.warn("NEXT_PUBLIC_AUTONOMYS_API_KEY is not configured");
    initFailed = true;
    return null;
  }

  // Create initialization promise
  initPromise = (async () => {
    try {
      // Dynamically import AutoDrive to avoid SSR issues
      const autoDriveModule = await import("@autonomys/auto-drive");

      // Check if the module loaded correctly
      if (!autoDriveModule || typeof autoDriveModule.createAutoDriveApi !== "function") {
        console.error("AutoDrive module failed to load correctly. Module:", autoDriveModule);
        initFailed = true;
        return null;
      }

      const { createAutoDriveApi } = autoDriveModule;

      // Initialize AutoDrive
      const instance = createAutoDriveApi({
        apiKey: AUTONOMYS_CONFIG.apiKey || "",
        network: AUTONOMYS_CONFIG.networkName,
      });

      autoDriveInstance = instance;
      console.log("AutoDrive initialized successfully");
      return instance;
    } catch (error) {
      initFailed = true;
      console.error("Failed to initialize AutoDrive:", error);
      if (error instanceof TypeError && error.message.includes("constructor")) {
        console.error("AutoDrive package has incompatible exports. The package may not work with this Next.js configuration.");
        console.warn("AutoDrive will be disabled. Subscription features will work without it.");
      }
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Upload data to Autonomys DSN
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

    const cid = await retryDSNOperation(async () => {
      const dataWithMetadata = {
        data,
        metadata: metadata || {},
      };

      const buffer = Buffer.from(JSON.stringify(dataWithMetadata));
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
 * Download data from Autonomys DSN
 */
export async function downloadFromAutoDrive(cid: string): Promise<string | null> {
  try {
    const autoDrive = await getAutoDrive();
    if (!autoDrive) {
      if (!AUTONOMYS_CONFIG.apiKey) {
        notifyAPIKeyMissing();
      }
      throw new DSNError("AutoDrive not initialized", cid);
    }

    notifyFileDownloading(cid);

    const data = await retryDSNOperation(async () => {
      const stream = await autoDrive.downloadFile(cid);

      let file = Buffer.alloc(0);
      for await (const chunk of stream) {
        file = Buffer.concat([file, chunk]);
      }

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
 * Check if AutoDrive is available
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
