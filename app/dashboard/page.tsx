/**
 * Dashboard page
 * Shows subscription status, payment history, storage usage, and transaction links
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { NetworkStatus } from '@/components/network-status';
import { WalletConnect } from '@/components/wallet-connect';
import { SubscriptionCard } from '@/components/subscription-badge';
import { StorageStatus } from '@/components/storage-status';
import { getPaymentHistory, PaymentTracker, PaymentStatus } from '@/lib/payment';
import { formatPaymentAmount } from '@/lib/payment';
import { getAI3TokenName } from '@/lib/web3';
import { exportAllData, handleFileImport } from '@/lib/export-import';
import { getLocalChats, saveChat } from '@/lib/chat-persistence';

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [paymentHistory, setPaymentHistory] = useState<PaymentTracker[]>([]);
  const tokenName = getAI3TokenName();

  useEffect(() => {
    if (isConnected) {
      const history = getPaymentHistory();
      setPaymentHistory(history);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-2xl font-bold">
              AI Memory Box
            </Link>
            <WalletConnect />
          </div>

          {/* Not connected message */}
          <div className="max-w-2xl mx-auto mt-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your wallet to view your dashboard, subscription, and storage details
              </p>
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case PaymentStatus.PENDING:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case PaymentStatus.PROCESSING:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case PaymentStatus.FAILED:
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case PaymentStatus.CANCELLED:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              AI Memory Box
            </Link>
            <Link href="/chat" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Go to Chat
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NetworkStatus />
            <WalletConnect />
          </div>
        </div>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view storage, and track payments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Subscription and Storage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
              <SubscriptionCard />

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all plans
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment History</h2>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">
                            {formatPaymentAmount(payment.amount)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.timestamp).toLocaleDateString()} at {new Date(payment.timestamp).toLocaleTimeString()}
                        </div>
                        {payment.txHash && (
                          <a
                            href={`${chain?.blockExplorers?.default?.url}/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            View transaction
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Storage and Quick Actions */}
          <div className="space-y-6">
            {/* Storage Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Storage</h2>
              <StorageStatus />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  href="/chat"
                  className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
                >
                  New Chat
                </Link>
                <Link
                  href="/"
                  className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-center transition-colors"
                >
                  View Plans
                </Link>
                <button
                  onClick={async () => {
                    await exportAllData();
                  }}
                  className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-center transition-colors"
                >
                  Export Data
                </button>
                <label className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium text-center transition-colors cursor-pointer">
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const chats = await handleFileImport(file);
                          // Save imported chats
                          chats.forEach((chat) => saveChat(chat, false));
                          window.location.reload();
                        } catch (error) {
                          console.error('Import failed:', error);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Wallet Address</div>
                  <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded font-mono text-xs break-all">
                    {address}
                  </code>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Network</div>
                  <div className="font-medium">{chain?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Token</div>
                  <div className="font-medium">{tokenName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
