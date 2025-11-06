/**
 * Subscription badge component
 * Displays user's subscription tier and status
 */

'use client';

import { useSubscription } from '@/lib/subscription';
import { SubscriptionPlan, getPlanName, PLAN_FEATURES } from '@/lib/contract';
import { useAccount } from 'wagmi';

export function SubscriptionBadge() {
  const { address } = useAccount();
  const { subscription, isActive, daysLeft, isLoading } = useSubscription();

  if (!address) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs animate-pulse">
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planName = getPlanName(plan);

  // Color scheme based on plan
  const getColorClass = () => {
    if (!isActive) return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case SubscriptionPlan.BASIC:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case SubscriptionPlan.PRO:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case SubscriptionPlan.UNLIMITED:
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 dark:from-yellow-900 dark:to-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getColorClass()}`}>
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

  if (!address) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to view subscription
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan ?? SubscriptionPlan.FREE;
  const planName = getPlanName(plan);
  const features = PLAN_FEATURES[plan];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{planName} Plan</h3>
        <SubscriptionBadge />
      </div>

      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {isActive && subscription?.expiresAt && (
          <div className="flex items-center justify-between text-sm mt-2">
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
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Plan Features:
        </h4>
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>
              {features.messages === Infinity
                ? 'Unlimited messages'
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
            <span>{features.models.join(', ')}</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {plan === SubscriptionPlan.FREE || !isActive ? (
          <a
            href="/pricing"
            className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
          >
            Upgrade Plan
          </a>
        ) : (
          <div className="flex gap-2">
            <a
              href="/pricing"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium transition-colors"
            >
              Extend
            </a>
            <button
              onClick={() => {
                // TODO: Implement cancel
                console.log('Cancel subscription');
              }}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-center rounded-lg font-medium transition-colors"
            >
              Manage
            </button>
          </div>
        )}
      </div>
    </div>
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
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded">
      <span className="text-xs text-gray-600 dark:text-gray-400">Plan:</span>
      <SubscriptionBadge />
    </div>
  );
}
