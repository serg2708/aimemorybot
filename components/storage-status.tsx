/**
 * Storage status component
 * Displays Autonomys DSN storage information
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAutoDriveStatus } from "@/lib/auto-drive";
import { getLatestCID, getStorageInfo } from "@/lib/memory-storage";
import { formatAddress } from "@/lib/web3";

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
    network: string;
    apiKeyConfigured: boolean;
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
        console.error("Error fetching storage info:", error);
        // Set default disconnected status on error
        setDsnStatus({
          connected: false,
          network: "mainnet",
          apiKeyConfigured: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStorageInfo();
  }, [address]);

  if (!address) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <p className="text-gray-600 text-sm dark:text-gray-400">
          Connect your wallet to see storage status
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 font-semibold text-sm">Storage Status</h3>

      <div className="space-y-2 text-sm">
        {/* DSN Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Autonomys DSN:
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                dsnStatus?.connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {dsnStatus?.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Storage Location */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Storage:</span>
          <span className="font-medium">
            {storageInfo?.hasDSN
              ? "Blockchain"
              : storageInfo?.hasLocal
                ? "Local"
                : "None"}
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
            <span className="text-gray-600 dark:text-gray-400">
              Last Updated:
            </span>
            <span className="font-medium">
              {new Date(storageInfo.lastUpdated).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* CID */}
        {storageInfo?.cid && (
          <div className="border-gray-200 border-t pt-2 dark:border-gray-700">
            <span className="text-gray-600 text-xs dark:text-gray-400">
              CID:
            </span>
            <div className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs dark:bg-gray-900">
              {storageInfo.cid}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {storageInfo?.hasLocal &&
        !storageInfo?.hasDSN &&
        dsnStatus?.connected && (
          <div className="mt-4 border-gray-200 border-t pt-4 dark:border-gray-700">
            <button
              className="w-full rounded bg-blue-600 px-3 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
              onClick={() => {
                // TODO: Implement migration
                console.log("Migrate to DSN");
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
    <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
      <span
        className={`h-2 w-2 rounded-full ${hasDSN ? "bg-green-500" : "bg-yellow-500"}`}
      />
      <span className="font-medium">{hasDSN ? "Blockchain" : "Local"}</span>
    </div>
  );
}
