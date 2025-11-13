/**
 * Home page - Landing page
 * Main landing page with hero section and CTA
 */

'use client';

import { useAccount } from '@/hooks/use-web3-safe';
import { WalletConnect } from '@/components/wallet-connect';
import Link from 'next/link';

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold">AI Memory Box</div>
          <div className="flex gap-4 items-center">
            <Link href="/pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
              Dashboard
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          AI Chat with
          <br />
          <span className="text-blue-600">Permanent Memory</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
          Your conversations stored forever on the blockchain. Encrypted, secure, and only accessible by you.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/chat"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Start Chatting Free
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-lg font-semibold rounded-lg transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-4xl font-bold text-center mb-16">
          Why AI Memory Box?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">End-to-End Encryption</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Your conversations are encrypted with your wallet. Only you can read your messages.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Blockchain Storage</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Permanent storage on Autonomys Network. Your data never disappears.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4">Private & Secure</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Only you have the keys to your data. Not even we can access it.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-24 bg-gray-50 dark:bg-gray-900 rounded-3xl">
        <h2 className="text-4xl font-bold text-center mb-16">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-4">1</div>
            <h3 className="text-xl font-semibold mb-2">Connect Wallet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Web3 wallet to get started
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-4">2</div>
            <h3 className="text-xl font-semibold mb-2">Start Chatting</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Have conversations with AI - all encrypted
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-4">3</div>
            <h3 className="text-xl font-semibold mb-2">Stored Forever</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your chats are saved on the blockchain permanently
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to get started?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Start with our free plan - no credit card required
        </p>
        <Link
          href="/chat"
          className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors"
        >
          Start Chatting Free
        </Link>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div>© 2024 AI Memory Box. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:underline">
              Pricing
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/chat" className="hover:underline">
              Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
