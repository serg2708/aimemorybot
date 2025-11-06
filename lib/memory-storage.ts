/**
 * Memory Storage - Combines encryption and Autonomys DSN for secure chat history
 */

import type { ChatMessage } from '@/lib/types';
import { encryptMessages, decryptMessages } from './encryption';
import {
  uploadToAutoDrive,
  downloadFromAutoDrive,
  isAutoDriveAvailable,
} from './auto-drive';

const STORAGE_PREFIX = 'aimemorybox_';
const CID_STORAGE_KEY = 'aimemorybox_cids';

/**
 * Storage options
 */
export interface StorageOptions {
  encrypted?: boolean; // Whether to encrypt messages
  useDSN?: boolean; // Whether to use Autonomys DSN
  fallbackToLocal?: boolean; // Fallback to localStorage if DSN fails
}

/**
 * CID mapping for user addresses
 */
interface CIDMapping {
  [address: string]: {
    cid: string;
    timestamp: number;
    messageCount: number;
  };
}

/**
 * Save messages for a user
 */
export async function saveMessages(
  address: string,
  messages: ChatMessage[],
  options: StorageOptions = {}
): Promise<string | null> {
  const {
    encrypted = true,
    useDSN = true,
    fallbackToLocal = true,
  } = options;

  try {
    // Prepare data
    let data: string;

    if (encrypted) {
      data = await encryptMessages(messages, address);
    } else {
      data = JSON.stringify(messages);
    }

    // Try to save to Autonomys DSN first
    if (useDSN) {
      const dsnAvailable = await isAutoDriveAvailable();

      if (dsnAvailable) {
        const cid = await uploadToAutoDrive(data, {
          address,
          timestamp: Date.now(),
          messageCount: messages.length,
        });

        if (cid) {
          // Save CID mapping locally
          saveCIDMapping(address, cid, messages.length);
          console.log(`Messages saved to DSN for ${address}:`, cid);
          return cid;
        }
      }
    }

    // Fallback to localStorage
    if (fallbackToLocal) {
      const key = `${STORAGE_PREFIX}${address}`;
      localStorage.setItem(key, data);
      console.log(`Messages saved to localStorage for ${address}`);
      return null; // No CID for local storage
    }

    throw new Error('Failed to save messages - no storage method available');
  } catch (error) {
    console.error('Error saving messages:', error);
    throw error;
  }
}

/**
 * Load messages for a user
 */
export async function loadMessages(
  address: string,
  cid?: string,
  options: StorageOptions = {}
): Promise<ChatMessage[]> {
  const {
    encrypted = true,
    useDSN = true,
    fallbackToLocal = true,
  } = options;

  try {
    let data: string | null = null;

    // Try to load from Autonomys DSN first
    if (useDSN && cid) {
      data = await downloadFromAutoDrive(cid);
    } else if (useDSN) {
      // Try to find CID from local mapping
      const mapping = getCIDMapping(address);
      if (mapping?.cid) {
        data = await downloadFromAutoDrive(mapping.cid);
      }
    }

    // Fallback to localStorage
    if (!data && fallbackToLocal) {
      const key = `${STORAGE_PREFIX}${address}`;
      data = localStorage.getItem(key);
    }

    if (!data) {
      // No data found - return empty array
      return [];
    }

    // Decrypt if needed
    if (encrypted) {
      return await decryptMessages(data, address);
    } else {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    // Return empty array on error rather than throwing
    return [];
  }
}

/**
 * Delete messages for a user
 */
export async function deleteMessages(
  address: string,
  options: StorageOptions = {}
): Promise<boolean> {
  const { useDSN = true, fallbackToLocal = true } = options;

  try {
    let success = false;

    // Delete from Autonomys DSN
    if (useDSN) {
      const mapping = getCIDMapping(address);
      if (mapping?.cid) {
        // Note: AutoDrive might not support deletion
        // In that case, we just remove the local CID mapping
        deleteCIDMapping(address);
        success = true;
      }
    }

    // Delete from localStorage
    if (fallbackToLocal) {
      const key = `${STORAGE_PREFIX}${address}`;
      localStorage.removeItem(key);
      success = true;
    }

    return success;
  } catch (error) {
    console.error('Error deleting messages:', error);
    return false;
  }
}

/**
 * Get latest CID for a user
 */
export function getLatestCID(address: string): string | null {
  const mapping = getCIDMapping(address);
  return mapping?.cid || null;
}

/**
 * Save CID mapping locally
 */
function saveCIDMapping(address: string, cid: string, messageCount: number): void {
  try {
    const mappings = getAllCIDMappings();
    mappings[address] = {
      cid,
      timestamp: Date.now(),
      messageCount,
    };
    localStorage.setItem(CID_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Error saving CID mapping:', error);
  }
}

/**
 * Get CID mapping for a user
 */
function getCIDMapping(address: string): CIDMapping[string] | null {
  try {
    const mappings = getAllCIDMappings();
    return mappings[address] || null;
  } catch (error) {
    console.error('Error getting CID mapping:', error);
    return null;
  }
}

/**
 * Get all CID mappings
 */
function getAllCIDMappings(): CIDMapping {
  try {
    const data = localStorage.getItem(CID_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting all CID mappings:', error);
    return {};
  }
}

/**
 * Delete CID mapping for a user
 */
function deleteCIDMapping(address: string): void {
  try {
    const mappings = getAllCIDMappings();
    delete mappings[address];
    localStorage.setItem(CID_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Error deleting CID mapping:', error);
  }
}

/**
 * Get storage statistics for a user
 */
export function getStorageInfo(address: string): {
  hasDSN: boolean;
  hasLocal: boolean;
  cid: string | null;
  lastUpdated: number | null;
  messageCount: number | null;
} {
  const mapping = getCIDMapping(address);
  const hasLocal = !!localStorage.getItem(`${STORAGE_PREFIX}${address}`);

  return {
    hasDSN: !!mapping?.cid,
    hasLocal,
    cid: mapping?.cid || null,
    lastUpdated: mapping?.timestamp || null,
    messageCount: mapping?.messageCount || null,
  };
}

/**
 * Migrate messages from localStorage to DSN
 */
export async function migrateToAutoDrive(address: string): Promise<string | null> {
  try {
    // Load from localStorage
    const messages = await loadMessages(address, undefined, {
      encrypted: true,
      useDSN: false,
      fallbackToLocal: true,
    });

    if (messages.length === 0) {
      console.log('No messages to migrate');
      return null;
    }

    // Save to DSN
    const cid = await saveMessages(address, messages, {
      encrypted: true,
      useDSN: true,
      fallbackToLocal: false,
    });

    console.log(`Migrated ${messages.length} messages to DSN for ${address}`);
    return cid;
  } catch (error) {
    console.error('Error migrating to AutoDrive:', error);
    return null;
  }
}
