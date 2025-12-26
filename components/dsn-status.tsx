/**
 * Enhanced DSN Status Component
 * Shows real-time connection status, CID of saved chats, and Explorer links
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { getAutoDriveStatus } from "@/lib/auto-drive";
import {
  notifyCopied,
  notifyDSNConnected,
  notifyDSNDisconnected,
} from "@/lib/notifications";

interface DSNStatusData {
  connected: boolean;
  network: string;
  apiKeyConfigured: boolean;
  lastCID?: string;
  totalFiles?: number;
}

export function DSNStatus() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState<DSNStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isConnected) {
        setStatus(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dsnStatus = await getAutoDriveStatus();
        setStatus(dsnStatus);
      } catch (error) {
        console.error("Error fetching DSN status:", error);
        setStatus({
          connected: false,
          network: "unknown",
          apiKeyConfigured: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [isConnected, address]);

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
        <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        <span className="text-gray-500 text-xs">Loading DSN...</span>
      </div>
    );
  }

  const statusColor = status?.connected ? "bg-green-500" : "bg-red-500";
  const statusText = status?.connected ? "Connected" : "Disconnected";

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Autonomys DSN Status"
      >
        {/* Status indicator */}
        <div
          className={`h-2 w-2 rounded-full ${statusColor} ${status?.connected ? "animate-pulse" : ""}`}
        />

        {/* Status text */}
        <span className="hidden font-medium text-xs md:inline">DSN</span>

        {/* Dropdown arrow */}
        <svg
          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isExpanded && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${statusColor}`} />
              <h3 className="font-semibold">Autonomys DSN</h3>
            </div>

            {/* Status details */}
            <div className="space-y-3 text-sm">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span
                  className={`font-medium ${status?.connected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {statusText}
                </span>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Network:
                </span>
                <span className="font-medium capitalize">
                  {status?.network || "Unknown"}
                </span>
              </div>

              {/* API Key */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  API Key:
                </span>
                <span
                  className={`font-medium ${status?.apiKeyConfigured ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}
                >
                  {status?.apiKeyConfigured ? "Configured" : "Not Set"}
                </span>
              </div>

              {/* Total Files */}
              {status?.totalFiles !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Files:
                  </span>
                  <span className="font-medium">{status.totalFiles}</span>
                </div>
              )}

              {/* Last CID */}
              {status?.lastCID && (
                <div className="border-gray-200 border-t pt-3 dark:border-gray-700">
                  <div className="mb-1 text-gray-600 text-xs dark:text-gray-400">
                    Last Saved CID:
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-900">
                      {status.lastCID.substring(0, 20)}...
                      {status.lastCID.substring(status.lastCID.length - 10)}
                    </code>
                    <button
                      className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => {
                        navigator.clipboard.writeText(status.lastCID!);
                        notifyCopied("CID");
                      }}
                      title="Copy CID"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Explorer link */}
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs hover:underline dark:text-blue-400"
                    href={`https://explorer.autonomys.xyz/cid/${status.lastCID}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View on Explorer
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </a>
                </div>
              )}

              {/* Warning if not configured */}
              {!status?.apiKeyConfigured && (
                <div className="border-gray-200 border-t pt-3 dark:border-gray-700">
                  <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      AutoDrive API key not configured. Add
                      NEXT_PUBLIC_AUTONOMYS_API_KEY to enable DSN storage.
                    </p>
                  </div>
                </div>
              )}

              {/* Refresh button */}
              <div className="border-gray-200 border-t pt-3 dark:border-gray-700">
                <button
                  className="w-full rounded bg-gray-100 px-3 py-2 font-medium text-xs transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={async () => {
                    setIsLoading(true);
                    const dsnStatus = await getAutoDriveStatus();
                    setStatus(dsnStatus);
                    setIsLoading(false);
                  }}
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact DSN indicator for mobile/small spaces
 */
export function DSNBadge() {
  const [isConnected, setIsConnected] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    const checkStatus = async () => {
      if (!address) return;
      try {
        const status = await getAutoDriveStatus();
        setIsConnected(status.connected);
      } catch {
        setIsConnected(false);
      }
    };

    checkStatus();
  }, [address]);

  if (!address) return null;

  return (
    <div className="flex items-center gap-1.5 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
      <div
        className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
      />
      <span className="font-medium">DSN</span>
    </div>
  );
}
