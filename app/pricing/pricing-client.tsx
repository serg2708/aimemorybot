/**
 * Pricing page
 * Displays subscription plans with AI3 token payments
 */

"use client";

import { useState } from "react";
import { SubscriptionCard } from "@/components/subscription-badge";
import { WalletConnect } from "@/components/wallet-connect";
import { useAccount } from "@/hooks/use-web3-safe";
import {
  calculatePriceInAI3,
  getPlanName,
  PLAN_FEATURES,
  PLAN_PRICES,
  SubscriptionPlan,
} from "@/lib/contract";
import { calculatePaymentAmount, formatPaymentAmount } from "@/lib/payment";
import { useSubscribe } from "@/lib/subscription";

export default function PricingPage() {
  const { address, isConnected } = useAccount();
  const [duration, setDuration] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  const { subscribe, isPending, isConfirming, isSuccess, error } =
    useSubscribe();

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setSelectedPlan(plan);

    try {
      const amount = calculatePaymentAmount(plan, duration);
      console.log("Subscribing to plan:", {
        plan,
        duration,
        amount: amount.toString(),
      });
      const result = await subscribe(plan, duration, amount);
      console.log("Subscription result:", result);
      alert("Subscription successful! Transaction submitted.");
    } catch (err: any) {
      console.error("Subscription failed:", err);
      const errorMessage = err?.message || err?.toString() || "Unknown error";
      alert(
        `Subscription failed: ${errorMessage}\n\nCheck console for details.`
      );
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
        <div className="flex items-center justify-between">
          <a className="font-bold text-2xl" href="/">
            AI Memory Box
          </a>
          <WalletConnect />
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 font-bold text-5xl">
          Choose Your <span className="text-blue-600">Memory Plan</span>
        </h1>
        <p className="mb-8 text-gray-600 text-xl dark:text-gray-400">
          Permanent blockchain storage for your AI conversations
        </p>

        {/* Duration Toggle */}
        <div className="mb-12 inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-700">
          <button
            className={`rounded-md px-6 py-2 font-medium transition-colors ${
              duration === "monthly"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setDuration("monthly")}
          >
            Monthly
          </button>
          <button
            className={`rounded-md px-6 py-2 font-medium transition-colors ${
              duration === "yearly"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setDuration("yearly")}
          >
            Yearly
            <span className="ml-2 rounded bg-green-500 px-2 py-0.5 text-white text-xs">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Current Subscription */}
      {isConnected && address && (
        <div className="container mx-auto mb-8 px-4">
          <div className="mx-auto max-w-2xl">
            <SubscriptionCard />
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const features = PLAN_FEATURES[plan];
            const usdPrice = PLAN_PRICES[plan][duration];
            const ai3Amount =
              plan !== SubscriptionPlan.FREE
                ? formatPaymentAmount(calculatePriceInAI3(plan, duration))
                : "0 AI3";
            const isPopular = plan === SubscriptionPlan.PRO;

            return (
              <div
                className={`relative rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 ${
                  isPopular
                    ? "scale-105 ring-2 ring-blue-600"
                    : "border border-gray-200 dark:border-gray-700"
                }`}
                key={plan}
              >
                {isPopular && (
                  <div className="-top-4 -translate-x-1/2 absolute left-1/2 rounded-full bg-blue-600 px-4 py-1 font-semibold text-sm text-white">
                    Most Popular
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="mb-2 font-bold text-2xl">{features.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="font-bold text-4xl text-blue-600">
                    {ai3Amount}
                  </div>
                  <div className="mt-1 text-gray-600 text-sm dark:text-gray-400">
                    ≈ ${usdPrice} USD / {duration === "monthly" ? "mo" : "yr"}
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-8 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-green-500">✓</span>
                    <span className="text-sm">
                      {features.messages === Number.POSITIVE_INFINITY
                        ? "Unlimited messages"
                        : `${features.messages} messages/day`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-green-500">✓</span>
                    <span className="text-sm">{features.storage} storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-green-500">✓</span>
                    <span className="text-sm">{features.history} history</span>
                  </li>
                  {features.models.map((model, idx) => (
                    <li className="flex items-start gap-2" key={idx}>
                      <span className="mt-1 text-green-500">✓</span>
                      <span className="text-sm">{model}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan === SubscriptionPlan.FREE ? (
                  <a
                    className="block w-full rounded-lg bg-gray-200 px-6 py-3 text-center font-semibold transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    href="/chat"
                  >
                    Start Free
                  </a>
                ) : (
                  <button
                    className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                      isPopular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    disabled={!isConnected || isPending || isConfirming}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isConnected
                      ? isPending || isConfirming
                        ? "Processing..."
                        : "Subscribe"
                      : "Connect Wallet"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Comparison */}
      <div className="container mx-auto bg-gray-50 px-4 py-16 dark:bg-gray-900">
        <h2 className="mb-12 text-center font-bold text-3xl">
          All Plans Include
        </h2>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
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
            <h3 className="mb-2 font-semibold text-xl">
              End-to-End Encryption
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your conversations are encrypted with your wallet
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <svg
                className="h-8 w-8 text-purple-600"
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
            <h3 className="mb-2 font-semibold text-xl">Blockchain Storage</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Permanent storage on Autonomys Network
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-8 w-8 text-green-600"
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
            <h3 className="mb-2 font-semibold text-xl">Private & Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Only you can access your data
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center font-bold text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <details className="group rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer font-semibold">
              How does blockchain storage work?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Your chat history is encrypted with your wallet and stored on the
              Autonomys blockchain. This means your data is permanent,
              decentralized, and only accessible by you.
            </p>
          </details>

          <details className="group rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer font-semibold">
              What payment methods do you accept?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              We accept AI3 tokens only on Autonomys Network. AI3 is the native
              utility token of the Autonomys ecosystem, designed specifically
              for AI services. You can pay using Autonomys Auto EVM
              (EVM-compatible chain).
            </p>
          </details>

          <details className="group rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer font-semibold">
              Can I cancel my subscription?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Yes, you can cancel anytime. You'll continue to have access until
              the end of your billing period. Your stored data remains on the
              blockchain forever.
            </p>
          </details>

          <details className="group rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer font-semibold">
              Is my data really private?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Absolutely. All conversations are encrypted end-to-end with your
              wallet address. Even we cannot read your chat history. Only you
              have the keys to decrypt your data.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
