/**
 * Chat persistence layer with auto-save to AutoDrive
 * Handles automatic backup of chat history to Autonomys DSN
 */

'use client';

import { uploadToAutoDrive, downloadFromAutoDrive } from './auto-drive';
import { notifyChatSaved, notifyChatLoaded, notifyError } from './notifications';
import { retryDSNOperation, handleError } from './error-handling';

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  address?: string;
  cid?: string; // CID if saved to DSN
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  CHATS: 'ai_memory_box_chats',
  LAST_SYNC: 'ai_memory_box_last_sync',
  CID_MAP: 'ai_memory_box_cid_map', // Maps chat IDs to CIDs
};

/**
 * Auto-save configuration
 */
const AUTO_SAVE_CONFIG = {
  enabled: true,
  debounceMs: 5000, // Save 5 seconds after last change
  syncIntervalMs: 60000, // Sync to DSN every minute
};

// Debounce timers
const saveTimers: Record<string, NodeJS.Timeout> = {};
let syncTimer: NodeJS.Timeout | null = null;

/**
 * Get all chats from local storage
 */
export function getLocalChats(): ChatSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load chats from local storage:', error);
    return [];
  }
}

/**
 * Save chats to local storage
 */
export function saveLocalChats(chats: ChatSession[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (error) {
    console.error('Failed to save chats to local storage:', error);
  }
}

/**
 * Get specific chat by ID
 */
export function getChatById(chatId: string): ChatSession | null {
  const chats = getLocalChats();
  return chats.find((chat) => chat.id === chatId) || null;
}

/**
 * Save or update chat (auto-saves to DSN with debounce)
 */
export function saveChat(chat: ChatSession, autoSaveToDSN: boolean = true): void {
  const chats = getLocalChats();
  const index = chats.findIndex((c) => c.id === chat.id);

  const updatedChat = {
    ...chat,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    chats[index] = updatedChat;
  } else {
    chats.push(updatedChat);
  }

  saveLocalChats(chats);
  notifyChatSaved('local');

  // Schedule DSN save with debounce
  if (autoSaveToDSN && AUTO_SAVE_CONFIG.enabled) {
    if (saveTimers[chat.id]) {
      clearTimeout(saveTimers[chat.id]);
    }

    saveTimers[chat.id] = setTimeout(() => {
      saveChatToDSN(chat.id, chat.address);
    }, AUTO_SAVE_CONFIG.debounceMs);
  }
}

/**
 * Save specific chat to AutoDrive DSN
 */
export async function saveChatToDSN(
  chatId: string,
  address?: string
): Promise<string | null> {
  try {
    const chat = getChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Prepare data
    const data = JSON.stringify(chat);

    // Upload to AutoDrive
    const cid = await uploadToAutoDrive(data, {
      address: address || chat.address,
      timestamp: Date.now(),
      messageCount: chat.messages.length,
    });

    if (!cid) {
      throw new Error('Failed to upload to DSN');
    }

    // Update chat with CID
    const chats = getLocalChats();
    const index = chats.findIndex((c) => c.id === chatId);
    if (index >= 0) {
      chats[index].cid = cid;
      saveLocalChats(chats);
    }

    // Store CID mapping
    storeCIDMapping(chatId, cid);

    notifyChatSaved('dsn');
    return cid;
  } catch (error) {
    handleError(error, 'Saving chat to DSN');
    return null;
  }
}

/**
 * Load chat from AutoDrive DSN by CID
 */
export async function loadChatFromDSN(cid: string): Promise<ChatSession | null> {
  try {
    const data = await downloadFromAutoDrive(cid);
    if (!data) {
      throw new Error('Failed to download from DSN');
    }

    const chat: ChatSession = JSON.parse(data);

    // Save to local storage
    saveChat(chat, false); // Don't trigger auto-save to DSN

    notifyChatLoaded('dsn');
    return chat;
  } catch (error) {
    handleError(error, 'Loading chat from DSN');
    return null;
  }
}

/**
 * Store CID mapping for chat ID
 */
function storeCIDMapping(chatId: string, cid: string): void {
  if (typeof window === 'undefined') return;

  try {
    const mappings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CID_MAP) || '{}'
    );
    mappings[chatId] = cid;
    localStorage.setItem(STORAGE_KEYS.CID_MAP, JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to store CID mapping:', error);
  }
}

/**
 * Get CID for chat ID
 */
export function getCIDForChat(chatId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const mappings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CID_MAP) || '{}'
    );
    return mappings[chatId] || null;
  } catch (error) {
    console.error('Failed to get CID mapping:', error);
    return null;
  }
}

/**
 * Sync all chats to DSN
 */
export async function syncAllChatsToDSN(address?: string): Promise<void> {
  try {
    const chats = getLocalChats();

    for (const chat of chats) {
      // Only sync chats that don't have a CID yet or are updated
      if (!chat.cid || chat.updatedAt > (chat.createdAt || 0)) {
        await saveChatToDSN(chat.id, address || chat.address);
      }
    }

    // Update last sync time
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    }
  } catch (error) {
    handleError(error, 'Syncing chats to DSN');
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return lastSync ? parseInt(lastSync, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Start auto-sync interval
 */
export function startAutoSync(address?: string): void {
  if (syncTimer) {
    clearInterval(syncTimer);
  }

  if (!AUTO_SAVE_CONFIG.enabled) return;

  syncTimer = setInterval(() => {
    syncAllChatsToDSN(address);
  }, AUTO_SAVE_CONFIG.syncIntervalMs);
}

/**
 * Stop auto-sync interval
 */
export function stopAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/**
 * Delete chat from local and DSN
 */
export function deleteChat(chatId: string): void {
  const chats = getLocalChats();
  const filtered = chats.filter((c) => c.id !== chatId);
  saveLocalChats(filtered);

  // Clear CID mapping
  if (typeof window !== 'undefined') {
    try {
      const mappings = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.CID_MAP) || '{}'
      );
      delete mappings[chatId];
      localStorage.setItem(STORAGE_KEYS.CID_MAP, JSON.stringify(mappings));
    } catch (error) {
      console.error('Failed to delete CID mapping:', error);
    }
  }

  // Clear save timer if exists
  if (saveTimers[chatId]) {
    clearTimeout(saveTimers[chatId]);
    delete saveTimers[chatId];
  }
}

/**
 * Export chat to JSON
 */
export function exportChatToJSON(chatId: string): string | null {
  const chat = getChatById(chatId);
  if (!chat) return null;

  return JSON.stringify(chat, null, 2);
}

/**
 * Import chat from JSON
 */
export function importChatFromJSON(jsonData: string): ChatSession | null {
  try {
    const chat: ChatSession = JSON.parse(jsonData);

    // Validate required fields
    if (!chat.id || !chat.messages || !Array.isArray(chat.messages)) {
      throw new Error('Invalid chat data');
    }

    // Save imported chat
    saveChat(chat, false);

    return chat;
  } catch (error) {
    handleError(error, 'Importing chat');
    return null;
  }
}

/**
 * Get storage stats
 */
export function getStorageStats(): {
  totalChats: number;
  totalMessages: number;
  chatsWithDSN: number;
  lastSync: number | null;
} {
  const chats = getLocalChats();
  const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
  const chatsWithDSN = chats.filter((chat) => chat.cid).length;
  const lastSync = getLastSyncTime();

  return {
    totalChats: chats.length,
    totalMessages,
    chatsWithDSN,
    lastSync,
  };
}
