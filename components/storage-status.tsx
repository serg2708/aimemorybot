/**
 * Storage status component
 * Displays Autonomys DSN storage information
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getStorageInfo, getLatestCID } from '@/lib/memory-storage';
import { getAutoDriveStatus } from '@/lib/auto-drive';
import { formatAddress } from '@/lib/web3';

interface StorageInfo {
  hasDSN: boolean;
  hasLocal: boolean;
  cid: string | null;
  lastUpdated: number | null;
  messageCount: number | null;
}

export function StorageStatus() {
  const { address } = useAccount();
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [dsnStatus, setDsnStatus] = useState<{
    connected: boolean;
    rpcUrl: string;
    chainId: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStorageInfo = async () => {
      if (!address) {
        setStorageInfo(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // Get storage info
        const info = getStorageInfo(address);
        setStorageInfo(info);

        // Get DSN status
        const status = await getAutoDriveStatus();
        setDsnStatus(status);
      } catch (error) {
        console.error('Error fetching storage info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageInfo();
  }, [address]);

  if (!address) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to see storage status
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold mb-3">Storage Status</h3>

      <div className="space-y-2 text-sm">
        {/* DSN Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Autonomys DSN:</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dsnStatus?.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              {dsnStatus?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Storage Location */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Storage:</span>
          <span className="font-medium">
            {storageInfo?.hasDSN ? 'Blockchain' : storageInfo?.hasLocal ? 'Local' : 'None'}
          </span>
        </div>

        {/* Message Count */}
        {storageInfo?.messageCount !== null && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Messages:</span>
            <span className="font-medium">{storageInfo?.messageCount}</span>
          </div>
        )}

        {/* Last Updated */}
        {storageInfo?.lastUpdated && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
            <span className="font-medium">
              {new Date(storageInfo.lastUpdated).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* CID */}
        {storageInfo?.cid && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-xs">CID:</span>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded font-mono text-xs break-all">
              {storageInfo.cid}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {storageInfo?.hasLocal && !storageInfo?.hasDSN && dsnStatus?.connected && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            onClick={() => {
              // TODO: Implement migration
              console.log('Migrate to DSN');
            }}
          >
            Migrate to Blockchain Storage
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact storage indicator for header
 */
export function StorageIndicator() {
  const { address } = useAccount();
  const [hasDSN, setHasDSN] = useState(false);

  useEffect(() => {
    if (address) {
      const info = getStorageInfo(address);
      setHasDSN(info.hasDSN);
    }
  }, [address]);

  if (!address) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
      <span
        className={`w-2 h-2 rounded-full ${hasDSN ? 'bg-green-500' : 'bg-yellow-500'}`}
      />
      <span className="font-medium">{hasDSN ? 'Blockchain' : 'Local'}</span>
    </div>
  );
}
