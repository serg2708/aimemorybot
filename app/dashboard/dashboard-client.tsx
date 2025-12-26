/**
 * Dashboard page
 * Shows subscription status, payment history, storage usage, and transaction links
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NetworkStatus } from "@/components/network-status";
import { StorageStatus } from "@/components/storage-status";
import { SubscriptionCard } from "@/components/subscription-badge";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "@/hooks/use-web3-safe";
import { getLocalChats, saveChat } from "@/lib/chat-persistence";
import { exportAllData, handleFileImport } from "@/lib/export-import";
import {
  formatPaymentAmount,
  getPaymentHistory,
  PaymentStatus,
  type PaymentTracker,
} from "@/lib/payment";
import { getAI3TokenName } from "@/lib/web3";

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
          <div className="mb-8 flex items-center justify-between">
            <Link className="font-bold text-2xl" href="/">
              AI Memory Box
            </Link>
            <WalletConnect />
          </div>

          {/* Not connected message */}
          <div className="mx-auto mt-20 max-w-2xl">
            <div className="rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h2 className="mb-2 font-bold text-2xl">Connect Your Wallet</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Connect your wallet to view your dashboard, subscription, and
                storage details
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
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20";
      case PaymentStatus.PENDING:
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20";
      case PaymentStatus.PROCESSING:
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20";
      case PaymentStatus.FAILED:
        return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20";
      case PaymentStatus.CANCELLED:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link className="font-bold text-2xl" href="/">
              AI Memory Box
            </Link>
            <Link
              className="text-blue-600 text-sm hover:underline dark:text-blue-400"
              href="/chat"
            >
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
          <h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view storage, and track payments
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Subscription and Storage */}
          <div className="space-y-6 lg:col-span-2">
            {/* Subscription Card */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-xl">
                Subscription Status
              </h2>
              <SubscriptionCard />

              <div className="mt-4 border-gray-200 border-t pt-4 dark:border-gray-700">
                <Link
                  className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline dark:text-blue-400"
                  href="/"
                >
                  View all plans
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Payment History */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-xl">Payment History</h2>

              {paymentHistory.length === 0 ? (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
                      key={payment.id}
                    >
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-medium">
                            {formatPaymentAmount(payment.amount)}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 font-medium text-xs ${getStatusColor(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div className="text-gray-600 text-sm dark:text-gray-400">
                          {new Date(payment.timestamp).toLocaleDateString()} at{" "}
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </div>
                        {payment.txHash && (
                          <a
                            className="mt-1 inline-flex items-center gap-1 text-blue-600 text-xs hover:underline dark:text-blue-400"
                            href={`${chain?.blockExplorers?.default?.url}/tx/${payment.txHash}`}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            View transaction
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
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-xl">Storage</h2>
              <StorageStatus />
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-xl">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700"
                  href="/chat"
                >
                  New Chat
                </Link>
                <Link
                  className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-center font-medium transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  href="/"
                >
                  View Plans
                </Link>
                <button
                  className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-center font-medium transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={async () => {
                    await exportAllData();
                  }}
                >
                  Export Data
                </button>
                <label className="block w-full cursor-pointer rounded-lg bg-gray-100 px-4 py-3 text-center font-medium transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                  Import Data
                  <input
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
                          console.error("Import failed:", error);
                        }
                      }
                    }}
                    type="file"
                  />
                </label>
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 font-semibold text-xl">Account</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="mb-1 text-gray-600 dark:text-gray-400">
                    Wallet Address
                  </div>
                  <code className="block break-all rounded bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-900">
                    {address}
                  </code>
                </div>
                <div>
                  <div className="mb-1 text-gray-600 dark:text-gray-400">
                    Network
                  </div>
                  <div className="font-medium">{chain?.name || "Unknown"}</div>
                </div>
                <div>
                  <div className="mb-1 text-gray-600 dark:text-gray-400">
                    Token
                  </div>
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
