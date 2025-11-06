/**
 * Smart contract interactions for AI Memory Box
 * Handles subscription payments and verification
 */

import { type Address, parseEther, encodeFunctionData } from 'viem';

/**
 * Subscription contract ABI (simplified)
 * In production, import from a proper ABI file
 */
export const SUBSCRIPTION_ABI = [
  {
    name: 'subscribe',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'plan', type: 'uint8' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'extendSubscription',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'duration', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getSubscription',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'plan', type: 'uint8' },
      { name: 'expiresAt', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
    ],
  },
  {
    name: 'cancelSubscription',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'Subscribed',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'plan', type: 'uint8', indexed: false },
      { name: 'duration', type: 'uint256', indexed: false },
      { name: 'expiresAt', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SubscriptionExtended',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'duration', type: 'uint256', indexed: false },
      { name: 'newExpiresAt', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SubscriptionCancelled',
    type: 'event',
    inputs: [{ name: 'user', type: 'address', indexed: true }],
  },
] as const;

/**
 * ERC20 Token ABI (for USDC/USDT payments)
 */
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * Subscription plan types
 */
export enum SubscriptionPlan {
  FREE = 0,
  BASIC = 1,
  PRO = 2,
  UNLIMITED = 3,
}

/**
 * Subscription data structure
 */
export interface SubscriptionData {
  plan: SubscriptionPlan;
  expiresAt: number;
  isActive: boolean;
}

/**
 * Pricing for different plans (in USD)
 */
export const PLAN_PRICES = {
  [SubscriptionPlan.FREE]: { monthly: 0, yearly: 0 },
  [SubscriptionPlan.BASIC]: { monthly: 9.99, yearly: 99.99 },
  [SubscriptionPlan.PRO]: { monthly: 19.99, yearly: 199.99 },
  [SubscriptionPlan.UNLIMITED]: { monthly: 49.99, yearly: 499.99 },
} as const;

/**
 * Plan features
 */
export const PLAN_FEATURES = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    messages: 10,
    storage: '1 MB',
    history: '7 days',
    models: ['Claude Haiku'],
  },
  [SubscriptionPlan.BASIC]: {
    name: 'Basic',
    messages: 100,
    storage: '100 MB',
    history: '30 days',
    models: ['Claude Haiku', 'Claude Sonnet'],
  },
  [SubscriptionPlan.PRO]: {
    name: 'Pro',
    messages: 1000,
    storage: '1 GB',
    history: 'Unlimited',
    models: ['Claude Haiku', 'Claude Sonnet', 'Claude Opus'],
  },
  [SubscriptionPlan.UNLIMITED]: {
    name: 'Unlimited',
    messages: Infinity,
    storage: '10 GB',
    history: 'Unlimited',
    models: ['All Claude Models', 'Priority Access'],
  },
} as const;

/**
 * Get plan name
 */
export function getPlanName(plan: SubscriptionPlan): string {
  return PLAN_FEATURES[plan].name;
}

/**
 * Get plan price
 */
export function getPlanPrice(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly'
): number {
  return PLAN_PRICES[plan][duration];
}

/**
 * Convert duration to seconds
 */
export function durationToSeconds(duration: 'monthly' | 'yearly'): bigint {
  const MONTH = 30 * 24 * 60 * 60; // 30 days in seconds
  const YEAR = 365 * 24 * 60 * 60; // 365 days in seconds

  return BigInt(duration === 'monthly' ? MONTH : YEAR);
}

/**
 * Encode subscribe function data
 */
export function encodeSubscribe(plan: SubscriptionPlan, duration: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: SUBSCRIPTION_ABI,
    functionName: 'subscribe',
    args: [plan, duration],
  });
}

/**
 * Encode extend subscription function data
 */
export function encodeExtendSubscription(duration: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: SUBSCRIPTION_ABI,
    functionName: 'extendSubscription',
    args: [duration],
  });
}

/**
 * Encode approve function data for ERC20
 */
export function encodeApprove(spender: Address, amount: bigint): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, amount],
  });
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: SubscriptionData): boolean {
  if (!subscription.isActive) return false;
  const now = Math.floor(Date.now() / 1000);
  return subscription.expiresAt > now;
}

/**
 * Get days until expiration
 */
export function getDaysUntilExpiration(subscription: SubscriptionData): number {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = subscription.expiresAt - now;
  return Math.max(0, Math.floor(secondsLeft / (24 * 60 * 60)));
}

/**
 * Parse subscription from contract response
 */
export function parseSubscription(data: readonly [number, bigint, boolean]): SubscriptionData {
  return {
    plan: data[0] as SubscriptionPlan,
    expiresAt: Number(data[1]),
    isActive: data[2],
  };
}

/**
 * Calculate total price in wei (for ETH payments)
 */
export function calculatePriceInWei(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly'
): bigint {
  const priceUSD = getPlanPrice(plan, duration);
  // In production, use a price oracle to get ETH/USD rate
  // For now, assume 1 ETH = $2000 USD
  const ethPrice = 2000;
  const priceInEth = priceUSD / ethPrice;
  return parseEther(priceInEth.toString());
}

/**
 * Calculate total price for stablecoins (USDC/USDT)
 */
export function calculatePriceInStablecoin(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly'
): bigint {
  const priceUSD = getPlanPrice(plan, duration);
  // Stablecoins typically have 6 decimals
  return BigInt(Math.floor(priceUSD * 1_000_000));
}

/**
 * Validate subscription plan
 */
export function isValidPlan(plan: number): plan is SubscriptionPlan {
  return plan >= SubscriptionPlan.FREE && plan <= SubscriptionPlan.UNLIMITED;
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(messagesPerDay: number): SubscriptionPlan {
  if (messagesPerDay <= 10) return SubscriptionPlan.FREE;
  if (messagesPerDay <= 100) return SubscriptionPlan.BASIC;
  if (messagesPerDay <= 1000) return SubscriptionPlan.PRO;
  return SubscriptionPlan.UNLIMITED;
}
