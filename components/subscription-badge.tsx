/**
 * Subscription badge component
 * Displays user's subscription tier and status
 */

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { getPlanName, PLAN_FEATURES, SubscriptionPlan } from "@/lib/contract";
import { useCancelSubscription, useSubscription } from "@/lib/subscription";

export function SubscriptionBadge() {
  const { address } = useAccount();
  const { subscription, isActive, daysLeft, isLoading } = useSubscription();

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-full bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
        <div className="h-4 w-16 rounded bg-gray-300 dark:bg-gray-700" />
      </div>
    );
  }

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planName = getPlanName(plan);

  // Color scheme based on plan
  const getColorClass = () => {
    if (!isActive)
      return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

    switch (plan) {
      case SubscriptionPlan.FREE:
        return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case SubscriptionPlan.BASIC:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case SubscriptionPlan.PRO:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case SubscriptionPlan.UNLIMITED:
        return "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 dark:from-yellow-900 dark:to-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div
      className={`rounded-full px-3 py-1.5 font-semibold text-xs ${getColorClass()}`}
    >
      {planName}
      {isActive && daysLeft > 0 && daysLeft <= 7 && (
        <span className="ml-1 text-red-600 dark:text-red-400">
          ({daysLeft}d left)
        </span>
      )}
    </div>
  );
}

/**
 * Detailed subscription card
 */
export function SubscriptionCard() {
  const { address } = useAccount();
  const { subscription, isActive, daysLeft, isLoading } = useSubscription();
  const { cancel, isPending: isCancelling } = useCancelSubscription();
  const [showManageModal, setShowManageModal] = useState(false);

  if (!address) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 text-sm dark:text-gray-400">
          Connect your wallet to view subscription
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 h-6 w-1/3 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-gray-300 dark:bg-gray-700" />
          <div className="h-4 w-2/3 rounded bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planName = getPlanName(plan);
  const features = PLAN_FEATURES[plan];

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will still have access until the end of your billing period."
      )
    ) {
      return;
    }

    try {
      await cancel();
      alert("Subscription cancelled successfully!");
      setShowManageModal(false);
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error);
      alert(
        `Failed to cancel subscription: ${error?.message || "Unknown error"}`
      );
    }
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{planName} Plan</h3>
          <SubscriptionBadge />
        </div>

        {/* Status */}
        <div className="mb-4 rounded bg-gray-50 p-3 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span
              className={`font-medium ${isActive ? "text-green-600" : "text-red-600"}`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {isActive && subscription?.expiresAt && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Expires:</span>
              <span className="font-medium">
                {new Date(subscription.expiresAt * 1000).toLocaleDateString()}
                {daysLeft > 0 && ` (${daysLeft} days)`}
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-600 text-sm dark:text-gray-400">
            Plan Features:
          </h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>
                {features.messages === Number.POSITIVE_INFINITY
                  ? "Unlimited messages"
                  : `${features.messages} messages/day`}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{features.storage} storage</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{features.history} history</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{features.models.join(", ")}</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 border-gray-200 border-t pt-4 dark:border-gray-700">
          {plan === SubscriptionPlan.FREE || !isActive ? (
            <a
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
              href="/pricing"
            >
              Upgrade Plan
            </a>
          ) : (
            <div className="flex gap-2">
              <a
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
                href="/pricing"
              >
                Extend
              </a>
              <button
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowManageModal(true)}
              >
                Manage
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manage Subscription Modal */}
      {showManageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-bold text-xl">Manage Subscription</h3>

            <div className="mb-6">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                You are currently on the <strong>{planName}</strong> plan.
              </p>

              {isActive && subscription?.expiresAt && (
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  Your subscription will expire on{" "}
                  <strong>
                    {new Date(
                      subscription.expiresAt * 1000
                    ).toLocaleDateString()}
                  </strong>
                  {daysLeft > 0 && ` (${daysLeft} days left)`}.
                </p>
              )}

              <p className="mb-4 text-gray-500 text-sm dark:text-gray-500">
                Canceling will stop auto-renewal but you'll keep access until
                the end of your billing period.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCancelling}
                onClick={handleCancel}
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
              <button
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowManageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Inline subscription status for sidebar
 */
export function InlineSubscriptionStatus() {
  const { subscription, isActive } = useSubscription();
  const { address } = useAccount();

  if (!address) return null;

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planName = getPlanName(plan);

  return (
    <div className="flex items-center justify-between rounded bg-gray-50 px-4 py-2 dark:bg-gray-900">
      <span className="text-gray-600 text-xs dark:text-gray-400">Plan:</span>
      <SubscriptionBadge />
    </div>
  );
}
