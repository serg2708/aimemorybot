/**
 * Home page - Landing page
 * Main landing page with hero section and CTA
 */

"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "@/hooks/use-web3-safe";

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="font-bold text-2xl">AI Memory Box</div>
          <div className="flex items-center gap-4">
            <Link
              className="font-medium text-sm hover:underline"
              href="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="font-medium text-sm hover:underline"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-6 font-bold text-6xl md:text-7xl">
          AI Chat with
          <br />
          <span className="text-blue-600">Permanent Memory</span>
        </h1>
        <p className="mx-auto mb-12 max-w-3xl text-gray-600 text-xl md:text-2xl dark:text-gray-400">
          Your conversations stored forever on the blockchain. Encrypted,
          secure, and only accessible by you.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            className="rounded-lg bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
            href="/chat"
          >
            Start Chatting Free
          </Link>
          <Link
            className="rounded-lg bg-gray-200 px-8 py-4 font-semibold text-lg transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            href="/pricing"
          >
            View Plans
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="mb-16 text-center font-bold text-4xl">
          Why AI Memory Box?
        </h2>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                className="h-10 w-10 text-blue-600"
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
            <h3 className="mb-4 font-semibold text-2xl">
              End-to-End Encryption
            </h3>
            <p className="text-gray-600 text-lg dark:text-gray-400">
              Your conversations are encrypted with your wallet. Only you can
              read your messages.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <svg
                className="h-10 w-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="mb-4 font-semibold text-2xl">Blockchain Storage</h3>
            <p className="text-gray-600 text-lg dark:text-gray-400">
              Permanent storage on Autonomys Network. Your data never
              disappears.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="mb-4 font-semibold text-2xl">Private & Secure</h3>
            <p className="text-gray-600 text-lg dark:text-gray-400">
              Only you have the keys to your data. Not even we can access it.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto rounded-3xl bg-gray-50 px-4 py-24 dark:bg-gray-900">
        <h2 className="mb-16 text-center font-bold text-4xl">How It Works</h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-4 font-bold text-5xl text-blue-600">1</div>
            <h3 className="mb-2 font-semibold text-xl">Connect Wallet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Web3 wallet to get started
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 font-bold text-5xl text-blue-600">2</div>
            <h3 className="mb-2 font-semibold text-xl">Start Chatting</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Have conversations with AI - all encrypted
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 font-bold text-5xl text-blue-600">3</div>
            <h3 className="mb-2 font-semibold text-xl">Stored Forever</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your chats are saved on the blockchain permanently
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="mb-6 font-bold text-4xl md:text-5xl">
          Ready to get started?
        </h2>
        <p className="mb-8 text-gray-600 text-xl dark:text-gray-400">
          Start with our free plan - no credit card required
        </p>
        <Link
          className="inline-block rounded-lg bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
          href="/chat"
        >
          Start Chatting Free
        </Link>
      </div>

      {/* Footer */}
      <div className="container mx-auto border-gray-200 border-t px-4 py-8 dark:border-gray-700">
        <div className="flex items-center justify-between text-gray-600 text-sm dark:text-gray-400">
          <div>© 2024 AI Memory Box. All rights reserved.</div>
          <div className="flex gap-6">
            <Link className="hover:underline" href="/pricing">
              Pricing
            </Link>
            <Link className="hover:underline" href="/dashboard">
              Dashboard
            </Link>
            <Link className="hover:underline" href="/chat">
              Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
