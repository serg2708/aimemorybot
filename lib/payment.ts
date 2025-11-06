/**
 * Payment processing utilities
 * Handles crypto payments via AI3 or direct wallet transactions
 */

'use client';

import { parseEther, type Address } from 'viem';
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import {
  SubscriptionPlan,
  calculatePriceInWei,
  calculatePriceInStablecoin
} from './contract';
import { getTokenAddress } from './web3';

/**
 * Payment method types
 */
export type PaymentMethod = 'ETH' | 'USDC' | 'USDT';

/**
 * Payment data structure
 */
export interface PaymentData {
  plan: SubscriptionPlan;
  duration: 'monthly' | 'yearly';
  method: PaymentMethod;
  amount: bigint;
  recipient: Address;
}

/**
 * Hook to handle crypto payments
 */
export function usePayment() {
  const { address, chainId } = useAccount();
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const processPayment = async (data: PaymentData) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setPaymentData(data);

    // For ETH payments, send directly
    if (data.method === 'ETH') {
      sendTransaction({
        to: data.recipient,
        value: data.amount,
      });
    } else {
      // For ERC20 tokens (USDC/USDT), we need to use a different approach
      // This would typically involve approving the token and then calling a contract
      throw new Error('Token payments not yet implemented');
    }
  };

  return {
    processPayment,
    paymentData,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to check user's balance
 */
export function useUserBalance(token: PaymentMethod = 'ETH') {
  const { address, chainId } = useAccount();

  // For ETH
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    query: {
      enabled: token === 'ETH' && !!address,
    },
  });

  // For ERC20 tokens
  const tokenAddress = chainId && token !== 'ETH'
    ? getTokenAddress(token, chainId)
    : undefined;

  const { data: tokenBalance, isLoading: tokenLoading } = useBalance({
    address,
    token: tokenAddress as Address,
    query: {
      enabled: token !== 'ETH' && !!address && !!tokenAddress,
    },
  });

  return {
    balance: token === 'ETH' ? ethBalance : tokenBalance,
    isLoading: token === 'ETH' ? ethLoading : tokenLoading,
  };
}

/**
 * Calculate payment amount based on plan and method
 */
export function calculatePaymentAmount(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly',
  method: PaymentMethod
): bigint {
  if (method === 'ETH') {
    return calculatePriceInWei(plan, duration);
  } else {
    return calculatePriceInStablecoin(plan, duration);
  }
}

/**
 * Check if user has sufficient balance
 */
export async function checkSufficientBalance(
  balance: bigint | undefined,
  requiredAmount: bigint
): Promise<boolean> {
  if (!balance) return false;
  return balance >= requiredAmount;
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: bigint, method: PaymentMethod): string {
  if (method === 'ETH') {
    const eth = Number(amount) / 1e18;
    return `${eth.toFixed(6)} ETH`;
  } else {
    // USDC/USDT have 6 decimals
    const usd = Number(amount) / 1e6;
    return `$${usd.toFixed(2)} ${method}`;
  }
}

/**
 * Get payment recipient address
 * In production, this would be the subscription contract or treasury
 */
export function getPaymentRecipient(): Address {
  return (process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT ||
    '0x0000000000000000000000000000000000000000') as Address;
}

/**
 * Create AI3 payment session
 * AI3 is a crypto payment processor
 */
export async function createAI3PaymentSession(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly',
  userAddress: string
): Promise<{ sessionId: string; paymentUrl: string } | null> {
  try {
    const response = await fetch('/api/payment/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan,
        duration,
        userAddress,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating AI3 payment session:', error);
    return null;
  }
}

/**
 * Verify AI3 payment completion
 */
export async function verifyAI3Payment(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/payment/verify?sessionId=${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    const data = await response.json();
    return data.verified === true;
  } catch (error) {
    console.error('Error verifying AI3 payment:', error);
    return false;
  }
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Track payment status
 */
export interface PaymentTracker {
  id: string;
  status: PaymentStatus;
  txHash?: string;
  timestamp: number;
  amount: bigint;
  method: PaymentMethod;
}

/**
 * Save payment tracking data to localStorage
 */
export function trackPayment(payment: PaymentTracker): void {
  try {
    const key = `payment_${payment.id}`;
    localStorage.setItem(key, JSON.stringify({
      ...payment,
      amount: payment.amount.toString(), // BigInt to string for JSON
    }));
  } catch (error) {
    console.error('Error tracking payment:', error);
  }
}

/**
 * Get payment tracking data
 */
export function getPaymentStatus(paymentId: string): PaymentTracker | null {
  try {
    const key = `payment_${paymentId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      amount: BigInt(parsed.amount), // String back to BigInt
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    return null;
  }
}

/**
 * Get all payment history
 */
export function getPaymentHistory(): PaymentTracker[] {
  try {
    const payments: PaymentTracker[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('payment_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          payments.push({
            ...parsed,
            amount: BigInt(parsed.amount),
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    return payments.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
}
