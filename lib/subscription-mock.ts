/**
 * Mock Subscription Implementation
 * Used when contract is not deployed yet for testing UI
 * To enable: Set NEXT_PUBLIC_MOCK_SUBSCRIPTION=true in .env.local
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { type SubscriptionData, SubscriptionPlan } from "./contract";

/**
 * Safe localStorage access (only in browser)
 */
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

/**
 * Mock subscription hook - simulates blockchain interactions
 */
export function useMockSubscription() {
  const { address } = useAccount();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Simulate loading delay
    setIsLoading(true);
    setTimeout(() => {
      const storage = getLocalStorage();
      if (storage) {
        // Load from localStorage
        const stored = storage.getItem(`mock_subscription_${address}`);
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setSubscription(data);
          } catch (error) {
            console.error("Failed to parse stored subscription:", error);
            setSubscription({
              plan: SubscriptionPlan.FREE,
              expiresAt: 0,
              isActive: false,
            });
          }
        } else {
          // Default to FREE plan - always active
          setSubscription({
            plan: SubscriptionPlan.FREE,
            expiresAt: 0,
            isActive: true, // FREE plan is always active
          });
        }
      } else {
        // No localStorage available (SSR) - default to FREE
        setSubscription({
          plan: SubscriptionPlan.FREE,
          expiresAt: 0,
          isActive: true, // FREE plan is always active
        });
      }
      setIsLoading(false);
    }, 500);
  }, [address]);

  const isActive = subscription ? isSubscriptionActive(subscription) : false;
  const daysLeft = subscription ? getDaysUntilExpiration(subscription) : 0;

  return {
    subscription,
    isActive,
    daysLeft,
    isLoading,
    error: null,
  };
}

/**
 * Mock subscribe hook
 */
export function useMockSubscribe() {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscribe = async (
    plan: SubscriptionPlan,
    duration: "monthly" | "yearly",
    value: bigint
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const storage = getLocalStorage();
    if (!storage) {
      throw new Error("localStorage not available");
    }

    setIsPending(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Calculate expiration
      const durationSeconds =
        duration === "monthly" ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60;
      const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;

      // Store subscription
      const subscription: SubscriptionData = {
        plan,
        expiresAt,
        isActive: true,
      };

      storage.setItem(
        `mock_subscription_${address}`,
        JSON.stringify(subscription)
      );

      setIsPending(false);
      setIsConfirming(true);

      // Simulate confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsConfirming(false);
      setIsSuccess(true);

      // Reload page to update subscription status
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      return { hash: "0xmock" + Math.random().toString(36).substring(2) };
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    subscribe,
    hash: undefined,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Mock extend subscription hook
 */
export function useMockExtendSubscription() {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const extend = async (duration: "monthly" | "yearly", value: bigint) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const storage = getLocalStorage();
    if (!storage) {
      throw new Error("localStorage not available");
    }

    setIsPending(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Load current subscription
      const stored = storage.getItem(`mock_subscription_${address}`);
      if (!stored) {
        throw new Error("No subscription to extend");
      }

      const current: SubscriptionData = JSON.parse(stored);

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Calculate new expiration
      const durationSeconds =
        duration === "monthly" ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60;

      const now = Math.floor(Date.now() / 1000);
      const newExpiresAt =
        (current.expiresAt > now ? current.expiresAt : now) + durationSeconds;

      // Update subscription
      const subscription: SubscriptionData = {
        ...current,
        expiresAt: newExpiresAt,
        isActive: true,
      };

      storage.setItem(
        `mock_subscription_${address}`,
        JSON.stringify(subscription)
      );

      setIsPending(false);
      setIsConfirming(true);

      // Simulate confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsConfirming(false);
      setIsSuccess(true);

      // Reload page to update subscription status
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      return { hash: "0xmock" + Math.random().toString(36).substring(2) };
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    extend,
    hash: undefined,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Mock cancel subscription hook
 */
export function useMockCancelSubscription() {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const storage = getLocalStorage();
    if (!storage) {
      throw new Error("localStorage not available");
    }

    setIsPending(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Remove subscription
      storage.removeItem(`mock_subscription_${address}`);

      setIsPending(false);
      setIsConfirming(true);

      // Simulate confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsConfirming(false);
      setIsSuccess(true);

      // Reload page to update subscription status
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      return { hash: "0xmock" + Math.random().toString(36).substring(2) };
    } catch (err: any) {
      setError(err);
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  return {
    cancel,
    hash: undefined,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Check if subscription is active
 */
function isSubscriptionActive(subscription: SubscriptionData): boolean {
  // FREE plan is always active
  if (subscription.plan === SubscriptionPlan.FREE) return true;

  if (!subscription.isActive) return false;
  const now = Math.floor(Date.now() / 1000);
  return subscription.expiresAt > now;
}

/**
 * Get days until expiration
 */
function getDaysUntilExpiration(subscription: SubscriptionData): number {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = subscription.expiresAt - now;
  return Math.max(0, Math.floor(secondsLeft / (24 * 60 * 60)));
}
