/**
 * Enhanced DSN Status Component
 * Shows real-time connection status, CID of saved chats, and Explorer links
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getAutoDriveStatus } from '@/lib/auto-drive';
import { notifyCopied, notifyDSNConnected, notifyDSNDisconnected } from '@/lib/notifications';

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
        console.error('Error fetching DSN status:', error);
        setStatus({
          connected: false,
          network: 'unknown',
          apiKeyConfigured: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address]);

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-xs text-gray-500">Loading DSN...</span>
      </div>
    );
  }

  const statusColor = status?.connected ? 'bg-green-500' : 'bg-red-500';
  const statusText = status?.connected ? 'Connected' : 'Disconnected';

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Autonomys DSN Status"
      >
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full ${statusColor} ${status?.connected ? 'animate-pulse' : ''}`} />

        {/* Status text */}
        <span className="text-xs font-medium hidden md:inline">
          DSN
        </span>

        {/* Dropdown arrow */}
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${statusColor}`} />
              <h3 className="font-semibold">Autonomys DSN</h3>
            </div>

            {/* Status details */}
            <div className="space-y-3 text-sm">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${status?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {statusText}
                </span>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Network:</span>
                <span className="font-medium capitalize">{status?.network || 'Unknown'}</span>
              </div>

              {/* API Key */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">API Key:</span>
                <span className={`font-medium ${status?.apiKeyConfigured ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {status?.apiKeyConfigured ? 'Configured' : 'Not Set'}
                </span>
              </div>

              {/* Total Files */}
              {status?.totalFiles !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Files:</span>
                  <span className="font-medium">{status.totalFiles}</span>
                </div>
              )}

              {/* Last CID */}
              {status?.lastCID && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Saved CID:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono break-all">
                      {status.lastCID.substring(0, 20)}...{status.lastCID.substring(status.lastCID.length - 10)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(status.lastCID!);
                        notifyCopied('CID');
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="Copy CID"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Explorer link */}
                  <a
                    href={`https://explorer.autonomys.xyz/cid/${status.lastCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Explorer
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Warning if not configured */}
              {!status?.apiKeyConfigured && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      AutoDrive API key not configured. Add NEXT_PUBLIC_AUTONOMYS_API_KEY to enable DSN storage.
                    </p>
                  </div>
                </div>
              )}

              {/* Refresh button */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    const dsnStatus = await getAutoDriveStatus();
                    setStatus(dsnStatus);
                    setIsLoading(false);
                  }}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium transition-colors"
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
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="font-medium">DSN</span>
    </div>
  );
}
