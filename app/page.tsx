/**
 * Pricing page
 * Displays subscription plans with AI3 token payments
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/wallet-connect';
import { SubscriptionCard } from '@/components/subscription-badge';
import {
  SubscriptionPlan,
  PLAN_PRICES,
  PLAN_FEATURES,
  getPlanName,
  calculatePriceInAI3,
} from '@/lib/contract';
import { useSubscribe } from '@/lib/subscription';
import { calculatePaymentAmount, formatPaymentAmount } from '@/lib/payment';

export default function PricingPage() {
  const { address, isConnected } = useAccount();
  const [duration, setDuration] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { subscribe, isPending, isConfirming, isSuccess, error } = useSubscribe();

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedPlan(plan);

    try {
      const amount = calculatePaymentAmount(plan, duration);
      await subscribe(plan, duration, amount);
    } catch (err) {
      console.error('Subscription failed:', err);
      alert('Subscription failed. Please try again.');
    }
  };

  const plans = [
    SubscriptionPlan.FREE,
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PRO,
    SubscriptionPlan.UNLIMITED,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <a href="/" className="text-2xl font-bold">
            AI Memory Box
          </a>
          <div className="flex gap-4 items-center">
            <a href="/chat" className="text-sm font-medium hover:underline">
              Start Chatting
            </a>
            <WalletConnect />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Choose Your <span className="text-blue-600">Memory Plan</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Permanent blockchain storage for your AI conversations
        </p>

        {/* Duration Toggle */}
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 p-1 mb-12">
          <button
            onClick={() => setDuration('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              duration === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setDuration('yearly')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              duration === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Current Subscription */}
      {isConnected && address && (
        <div className="container mx-auto px-4 mb-8">
          <div className="max-w-2xl mx-auto">
            <SubscriptionCard />
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const features = PLAN_FEATURES[plan];
            const usdPrice = PLAN_PRICES[plan][duration];
            const ai3Amount = plan !== SubscriptionPlan.FREE
              ? formatPaymentAmount(calculatePriceInAI3(plan, duration))
              : '0 AI3';
            const isPopular = plan === SubscriptionPlan.PRO;

            return (
              <div
                key={plan}
                className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg ${
                  isPopular
                    ? 'ring-2 ring-blue-600 scale-105'
                    : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-2xl font-bold mb-2">{features.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-4xl font-bold text-blue-600">{ai3Amount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ≈ ${usdPrice} USD / {duration === 'monthly' ? 'mo' : 'yr'}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm">
                      {features.messages === Infinity
                        ? 'Unlimited messages'
                        : `${features.messages} messages/day`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm">{features.storage} storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm">{features.history} history</span>
                  </li>
                  {features.models.map((model, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{model}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan === SubscriptionPlan.FREE ? (
                  <a
                    href="/chat"
                    className="block w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-center rounded-lg font-semibold transition-colors"
                  >
                    Start Free
                  </a>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={!isConnected || isPending || isConfirming}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {!isConnected
                      ? 'Connect Wallet'
                      : isPending || isConfirming
                      ? 'Processing...'
                      : 'Subscribe'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12">All Plans Include</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
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
            <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your conversations are encrypted with your wallet
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
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
            <h3 className="text-xl font-semibold mb-2">Blockchain Storage</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Permanent storage on Autonomys Network
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h3 className="text-xl font-semibold mb-2">Private & Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Only you can access your data
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <details className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="font-semibold cursor-pointer">
              How does blockchain storage work?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Your chat history is encrypted with your wallet and stored on the Autonomys
              blockchain. This means your data is permanent, decentralized, and only
              accessible by you.
            </p>
          </details>

          <details className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="font-semibold cursor-pointer">
              What payment methods do you accept?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              We accept AI3 tokens only on Autonomys Network. AI3 is the native utility token
              of the Autonomys ecosystem, designed specifically for AI services. You can pay
              using Autonomys Auto EVM (EVM-compatible chain).
            </p>
          </details>

          <details className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="font-semibold cursor-pointer">
              Can I cancel my subscription?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Yes, you can cancel anytime. You'll continue to have access until the end of your
              billing period. Your stored data remains on the blockchain forever.
            </p>
          </details>

          <details className="group p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="font-semibold cursor-pointer">
              Is my data really private?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Absolutely. All conversations are encrypted end-to-end with your wallet address.
              Even we cannot read your chat history. Only you have the keys to decrypt your data.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
