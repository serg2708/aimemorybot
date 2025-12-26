/**
 * React hook for auto-saving chats
 * Provides automatic sync to AutoDrive DSN
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAutoDriveStatus } from "./auto-drive";
import {
  type ChatSession,
  getChatById,
  getStorageStats,
  saveChat,
  saveChatToDSN,
  startAutoSync,
  stopAutoSync,
  syncAllChatsToDSN,
} from "./chat-persistence";

export function useAutoSave(chatId?: string) {
  const { address, isConnected } = useAccount();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [dsnEnabled, setDsnEnabled] = useState(false);

  // Check DSN status
  useEffect(() => {
    const checkDSN = async () => {
      const status = await getAutoDriveStatus();
      setDsnEnabled(status.connected && status.apiKeyConfigured);
    };

    checkDSN();
  }, []);

  // Start auto-sync when wallet is connected
  useEffect(() => {
    if (isConnected && address && dsnEnabled) {
      startAutoSync(address);

      return () => {
        stopAutoSync();
      };
    }
  }, [isConnected, address, dsnEnabled]);

  /**
   * Save chat to local storage and queue DSN save
   */
  const save = useCallback(
    (chat: ChatSession) => {
      saveChat(chat, dsnEnabled && isConnected);
      setLastSaved(Date.now());
    },
    [dsnEnabled, isConnected]
  );

  /**
   * Force save to DSN immediately
   */
  const forceSaveToDSN = useCallback(async () => {
    if (!chatId || !dsnEnabled) return null;

    setIsSaving(true);
    try {
      const cid = await saveChatToDSN(chatId, address);
      setLastSaved(Date.now());
      return cid;
    } finally {
      setIsSaving(false);
    }
  }, [chatId, address, dsnEnabled]);

  /**
   * Sync all chats to DSN
   */
  const syncAll = useCallback(async () => {
    if (!dsnEnabled) return;

    setIsSaving(true);
    try {
      await syncAllChatsToDSN(address);
      setLastSaved(Date.now());
    } finally {
      setIsSaving(false);
    }
  }, [address, dsnEnabled]);

  /**
   * Get current chat
   */
  const currentChat = chatId ? getChatById(chatId) : null;

  /**
   * Get storage stats
   */
  const stats = getStorageStats();

  return {
    save,
    forceSaveToDSN,
    syncAll,
    isSaving,
    lastSaved,
    dsnEnabled,
    currentChat,
    stats,
  };
}

/**
 * Hook for monitoring DSN sync status
 */
export function useDSNSyncStatus() {
  const { address, isConnected } = useAccount();
  const [syncStatus, setSyncStatus] = useState<{
    isSyncing: boolean;
    lastSync: number | null;
    chatsWithDSN: number;
    totalChats: number;
  }>({
    isSyncing: false,
    lastSync: null,
    chatsWithDSN: 0,
    totalChats: 0,
  });

  useEffect(() => {
    const updateStatus = () => {
      const stats = getStorageStats();
      setSyncStatus({
        isSyncing: false,
        lastSync: stats.lastSync,
        chatsWithDSN: stats.chatsWithDSN,
        totalChats: stats.totalChats,
      });
    };

    updateStatus();

    // Update every 10 seconds
    const interval = setInterval(updateStatus, 10_000);

    return () => clearInterval(interval);
  }, [address, isConnected]);

  return syncStatus;
}
