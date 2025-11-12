/**
 * Client-side subscription management
 * Handles subscription state, wallet interactions, and contract calls
 */

'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useState } from 'react';
import {
  SUBSCRIPTION_ABI,
  SubscriptionPlan,
  type SubscriptionData,
  parseSubscription,
  isSubscriptionActive,
  getDaysUntilExpiration,
} from './contract';
import { CONTRACT_ADDRESSES } from './web3';

/**
 * Hook to get user's subscription data
 */
export function useSubscription() {
  const { address, chainId } = useAccount();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = chainId
    ? CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription]
    : undefined;

  const { data, isError, isLoading: isReading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: 'getSubscription',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  useEffect(() => {
    if (isReading) {
      setIsLoading(true);
    } else if (isError) {
      setError(new Error('Failed to fetch subscription'));
      setIsLoading(false);
    } else if (data) {
      setSubscription(parseSubscription(data));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [data, isError, isReading]);

  return {
    subscription,
    isActive: subscription ? isSubscriptionActive(subscription) : false,
    daysLeft: subscription ? getDaysUntilExpiration(subscription) : 0,
    isLoading,
    error,
  };
}

/**
 * Hook to subscribe to a plan
 */
export function useSubscribe() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const subscribe = async (
    plan: SubscriptionPlan,
    duration: 'monthly' | 'yearly',
    value: bigint
  ) => {
    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription]
      : undefined;

    if (!contractAddress) {
      throw new Error('Subscription contract not available on this chain');
    }

    const durationSeconds = duration === 'monthly'
      ? BigInt(30 * 24 * 60 * 60)
      : BigInt(365 * 24 * 60 * 60);

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: 'subscribe',
      args: [plan, durationSeconds],
      value,
    });
  };

  return {
    subscribe,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to extend subscription
 */
export function useExtendSubscription() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const extend = async (duration: 'monthly' | 'yearly', value: bigint) => {
    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription]
      : undefined;

    if (!contractAddress) {
      throw new Error('Subscription contract not available on this chain');
    }

    const durationSeconds = duration === 'monthly'
      ? BigInt(30 * 24 * 60 * 60)
      : BigInt(365 * 24 * 60 * 60);

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: 'extendSubscription',
      args: [durationSeconds],
      value,
    });
  };

  return {
    extend,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const cancel = async () => {
    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription]
      : undefined;

    if (!contractAddress) {
      throw new Error('Subscription contract not available on this chain');
    }

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: 'cancelSubscription',
    });
  };

  return {
    cancel,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Local storage keys for subscription cache
 */
const SUBSCRIPTION_CACHE_KEY = 'aimemorybox_subscription_cache';

/**
 * Cache subscription data locally
 */
export function cacheSubscription(address: string, subscription: SubscriptionData): void {
  try {
    const cache = {
      [address.toLowerCase()]: {
        ...subscription,
        cachedAt: Date.now(),
      },
    };
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache subscription:', error);
  }
}

/**
 * Get cached subscription data
 */
export function getCachedSubscription(address: string): SubscriptionData | null {
  try {
    const cacheStr = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (!cacheStr) return null;

    const cache = JSON.parse(cacheStr);
    const cached = cache[address.toLowerCase()];

    if (!cached) return null;

    // Cache is valid for 5 minutes
    const cacheAge = Date.now() - cached.cachedAt;
    if (cacheAge > 5 * 60 * 1000) return null;

    return {
      plan: cached.plan,
      expiresAt: cached.expiresAt,
      isActive: cached.isActive,
    };
  } catch (error) {
    console.error('Failed to get cached subscription:', error);
    return null;
  }
}

/**
 * Clear subscription cache
 */
export function clearSubscriptionCache(): void {
  try {
    localStorage.removeItem(SUBSCRIPTION_CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear subscription cache:', error);
  }
}

/**
 * Check if user has access to a feature based on their plan
 */
export function hasFeatureAccess(
  subscription: SubscriptionData | null,
  feature: 'advanced_models' | 'unlimited_history' | 'priority_support'
): boolean {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return false;
  }

  switch (feature) {
    case 'advanced_models':
      return subscription.plan >= SubscriptionPlan.BASIC;
    case 'unlimited_history':
      return subscription.plan >= SubscriptionPlan.PRO;
    case 'priority_support':
      return subscription.plan >= SubscriptionPlan.UNLIMITED;
    default:
      return false;
  }
}

/**
 * Get message limit based on subscription plan
 */
export function getMessageLimit(subscription: SubscriptionData | null): number {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return 10; // Free tier
  }

  switch (subscription.plan) {
    case SubscriptionPlan.FREE:
      return 10;
    case SubscriptionPlan.BASIC:
      return 100;
    case SubscriptionPlan.PRO:
      return 1000;
    case SubscriptionPlan.UNLIMITED:
      return Infinity;
    default:
      return 10;
  }
}
