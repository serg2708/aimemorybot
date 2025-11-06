/**
 * Server-side subscription verification
 * Used in API routes to check subscription status
 */

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {
  SUBSCRIPTION_ABI,
  type SubscriptionData,
  parseSubscription,
  isSubscriptionActive,
} from './contract';
import { CONTRACT_ADDRESSES } from './web3';

/**
 * Cache for subscription data to reduce RPC calls
 */
const subscriptionCache = new Map<
  string,
  { data: SubscriptionData; timestamp: number }
>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get subscription for an address (server-side)
 */
export async function getSubscription(
  address: string,
  chainId: number = mainnet.id
): Promise<SubscriptionData | null> {
  const cacheKey = `${address.toLowerCase()}_${chainId}`;

  // Check cache first
  const cached = subscriptionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const contractAddress =
      CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription];

    if (!contractAddress) {
      console.error(`No subscription contract for chain ${chainId}`);
      return null;
    }

    // Create a public client for the specific chain
    const client = createPublicClient({
      chain: mainnet, // TODO: Use dynamic chain based on chainId
      transport: http(),
    });

    // Read subscription from contract
    const data = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: SUBSCRIPTION_ABI,
      functionName: 'getSubscription',
      args: [address as `0x${string}`],
    });

    const subscription = parseSubscription(data);

    // Cache the result
    subscriptionCache.set(cacheKey, {
      data: subscription,
      timestamp: Date.now(),
    });

    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Verify if a user has an active subscription (server-side)
 */
export async function verifySubscription(
  address: string,
  chainId?: number
): Promise<boolean> {
  const subscription = await getSubscription(address, chainId);
  return subscription ? isSubscriptionActive(subscription) : false;
}

/**
 * Clear subscription cache for an address
 */
export function clearSubscriptionCache(address: string, chainId: number): void {
  const cacheKey = `${address.toLowerCase()}_${chainId}`;
  subscriptionCache.delete(cacheKey);
}

/**
 * Clear all subscription caches
 */
export function clearAllSubscriptionCaches(): void {
  subscriptionCache.clear();
}

/**
 * Get subscription stats (admin function)
 */
export function getSubscriptionCacheStats(): {
  size: number;
  entries: Array<{ address: string; plan: number; expiresAt: number }>;
} {
  const entries = Array.from(subscriptionCache.entries()).map(([key, value]) => {
    const [address] = key.split('_');
    return {
      address,
      plan: value.data.plan,
      expiresAt: value.data.expiresAt,
    };
  });

  return {
    size: subscriptionCache.size,
    entries,
  };
}

/**
 * Middleware to check subscription in API routes
 */
export async function requireSubscription(
  address: string | undefined,
  chainId?: number
): Promise<{ authorized: boolean; subscription: SubscriptionData | null }> {
  if (!address) {
    return { authorized: false, subscription: null };
  }

  const subscription = await getSubscription(address, chainId);

  if (!subscription || !isSubscriptionActive(subscription)) {
    return { authorized: false, subscription };
  }

  return { authorized: true, subscription };
}

/**
 * Check if address has reached message limit
 */
export async function checkMessageLimit(
  address: string,
  messageCount: number,
  chainId?: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const subscription = await getSubscription(address, chainId);

  let limit = 10; // Free tier default

  if (subscription && isSubscriptionActive(subscription)) {
    switch (subscription.plan) {
      case 0: // FREE
        limit = 10;
        break;
      case 1: // BASIC
        limit = 100;
        break;
      case 2: // PRO
        limit = 1000;
        break;
      case 3: // UNLIMITED
        limit = Infinity;
        break;
    }
  }

  const remaining = Math.max(0, limit - messageCount);
  const allowed = messageCount < limit;

  return { allowed, limit, remaining };
}

/**
 * Rate limiting based on subscription tier
 */
export function getRateLimitBySubscription(subscription: SubscriptionData | null): {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
} {
  if (!subscription || !isSubscriptionActive(subscription)) {
    return {
      requestsPerMinute: 2,
      requestsPerHour: 10,
      requestsPerDay: 50,
    };
  }

  switch (subscription.plan) {
    case 1: // BASIC
      return {
        requestsPerMinute: 5,
        requestsPerHour: 100,
        requestsPerDay: 500,
      };
    case 2: // PRO
      return {
        requestsPerMinute: 10,
        requestsPerHour: 500,
        requestsPerDay: 2000,
      };
    case 3: // UNLIMITED
      return {
        requestsPerMinute: 30,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
      };
    default:
      return {
        requestsPerMinute: 2,
        requestsPerHour: 10,
        requestsPerDay: 50,
      };
  }
}
