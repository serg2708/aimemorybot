/**
 * Client-side subscription management
 * Handles subscription state, wallet interactions, and contract calls
 * Falls back to mock mode when contract is not configured
 */

"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  getDaysUntilExpiration,
  isSubscriptionActive,
  parseSubscription,
  SUBSCRIPTION_ABI,
  type SubscriptionData,
  SubscriptionPlan,
} from "./contract";
import {
  useMockCancelSubscription,
  useMockExtendSubscription,
  useMockSubscribe,
  useMockSubscription,
} from "./subscription-mock";
import { CONTRACT_ADDRESSES } from "./web3";

// Check if we should use mock mode
const useMockMode = () => {
  const { chainId } = useAccount();
  const contractAddress = chainId
    ? CONTRACT_ADDRESSES.subscription[
        chainId as keyof typeof CONTRACT_ADDRESSES.subscription
      ]
    : undefined;

  // Use mock mode if:
  // 1. Explicitly enabled via env var, OR
  // 2. Contract address is not configured
  return (
    process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION === "true" ||
    !contractAddress ||
    contractAddress === ""
  );
};

/**
 * Hook to get user's subscription data
 * Automatically uses mock mode if contract is not configured
 */
export function useSubscription() {
  const mockMode = useMockMode();
  const mockSubscription = useMockSubscription();
  const { address, chainId } = useAccount();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = chainId
    ? CONTRACT_ADDRESSES.subscription[
        chainId as keyof typeof CONTRACT_ADDRESSES.subscription
      ]
    : undefined;

  const {
    data,
    isError,
    isLoading: isReading,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "getSubscription",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress && !mockMode,
    },
  });

  useEffect(() => {
    if (mockMode) {
      // Use mock data
      return;
    }

    if (isReading) {
      setIsLoading(true);
    } else if (isError) {
      setError(new Error("Failed to fetch subscription"));
      setIsLoading(false);
    } else if (data) {
      setSubscription(parseSubscription(data));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [data, isError, isReading, mockMode]);

  // Return mock data if in mock mode
  if (mockMode) {
    return mockSubscription;
  }

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
 * Automatically uses mock mode if contract is not configured
 */
export function useSubscribe() {
  const mockMode = useMockMode();
  const mockSubscribe = useMockSubscribe();
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const subscribe = async (
    plan: SubscriptionPlan,
    duration: "monthly" | "yearly",
    value: bigint
  ) => {
    // Use mock mode if enabled
    if (mockMode) {
      return mockSubscribe.subscribe(plan, duration, value);
    }

    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[
          chainId as keyof typeof CONTRACT_ADDRESSES.subscription
        ]
      : undefined;

    if (!contractAddress) {
      throw new Error("Subscription contract not available on this chain");
    }

    const durationSeconds =
      duration === "monthly"
        ? BigInt(30 * 24 * 60 * 60)
        : BigInt(365 * 24 * 60 * 60);

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "subscribe",
      args: [plan, durationSeconds],
      value,
    });
  };

  // Return mock state if in mock mode
  if (mockMode) {
    return {
      subscribe,
      hash: mockSubscribe.hash,
      isPending: mockSubscribe.isPending,
      isConfirming: mockSubscribe.isConfirming,
      isSuccess: mockSubscribe.isSuccess,
      error: mockSubscribe.error,
    };
  }

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
 * Automatically uses mock mode if contract is not configured
 */
export function useExtendSubscription() {
  const mockMode = useMockMode();
  const mockExtend = useMockExtendSubscription();
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const extend = async (duration: "monthly" | "yearly", value: bigint) => {
    // Use mock mode if enabled
    if (mockMode) {
      return mockExtend.extend(duration, value);
    }

    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[
          chainId as keyof typeof CONTRACT_ADDRESSES.subscription
        ]
      : undefined;

    if (!contractAddress) {
      throw new Error("Subscription contract not available on this chain");
    }

    const durationSeconds =
      duration === "monthly"
        ? BigInt(30 * 24 * 60 * 60)
        : BigInt(365 * 24 * 60 * 60);

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "extendSubscription",
      args: [durationSeconds],
      value,
    });
  };

  // Return mock state if in mock mode
  if (mockMode) {
    return {
      extend,
      hash: mockExtend.hash,
      isPending: mockExtend.isPending,
      isConfirming: mockExtend.isConfirming,
      isSuccess: mockExtend.isSuccess,
      error: mockExtend.error,
    };
  }

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
 * Automatically uses mock mode if contract is not configured
 */
export function useCancelSubscription() {
  const mockMode = useMockMode();
  const mockCancel = useMockCancelSubscription();
  const {
    writeContractAsync,
    data: hash,
    isPending,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { chainId } = useAccount();

  const cancel = async () => {
    // Use mock mode if enabled
    if (mockMode) {
      return mockCancel.cancel();
    }

    const contractAddress = chainId
      ? CONTRACT_ADDRESSES.subscription[
          chainId as keyof typeof CONTRACT_ADDRESSES.subscription
        ]
      : undefined;

    if (!contractAddress) {
      throw new Error("Subscription contract not available on this chain");
    }

    return writeContractAsync({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: "cancelSubscription",
    });
  };

  // Return mock state if in mock mode
  if (mockMode) {
    return {
      cancel,
      hash: mockCancel.hash,
      isPending: mockCancel.isPending,
      isConfirming: mockCancel.isConfirming,
      isSuccess: mockCancel.isSuccess,
      error: mockCancel.error,
    };
  }

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
const SUBSCRIPTION_CACHE_KEY = "aimemorybox_subscription_cache";

/**
 * Cache subscription data locally
 */
export function cacheSubscription(
  address: string,
  subscription: SubscriptionData
): void {
  try {
    const cache = {
      [address.toLowerCase()]: {
        ...subscription,
        cachedAt: Date.now(),
      },
    };
    localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to cache subscription:", error);
  }
}

/**
 * Get cached subscription data
 */
export function getCachedSubscription(
  address: string
): SubscriptionData | null {
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
    console.error("Failed to get cached subscription:", error);
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
    console.error("Failed to clear subscription cache:", error);
  }
}

/**
 * Check if user has access to a feature based on their plan
 */
export function hasFeatureAccess(
  subscription: SubscriptionData | null,
  feature: "advanced_models" | "unlimited_history" | "priority_support"
): boolean {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return false;
  }

  switch (feature) {
    case "advanced_models":
      return subscription.plan >= SubscriptionPlan.BASIC;
    case "unlimited_history":
      return subscription.plan >= SubscriptionPlan.PRO;
    case "priority_support":
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
      return Number.POSITIVE_INFINITY;
    default:
      return 10;
  }
}
