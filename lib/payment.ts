/**
 * Payment processing utilities
 * Handles AI3 token payments only
 */

'use client';

import { parseEther, type Address } from 'viem';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState } from 'react';
import {
  SubscriptionPlan,
  calculatePriceInAI3,
} from './contract';
import { getAI3TokenAddress, getAI3TokenName } from './web3';
import { ERC20_ABI } from './contract';

/**
 * Payment method types - AI3 only
 */
export type PaymentMethod = 'AI3';

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
 * Hook to handle AI3 token payments
 */
export function usePayment() {
  const { address, chainId } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const processPayment = async (data: PaymentData) => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    const ai3TokenAddress = getAI3TokenAddress(chainId);
    if (!ai3TokenAddress) {
      throw new Error('AI3 token not available on this chain');
    }

    setPaymentData(data);

    // Transfer AI3 tokens to recipient
    writeContract({
      address: ai3TokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [data.recipient, data.amount],
    });
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
 * Hook to check user's AI3 balance
 */
export function useUserBalance() {
  const { address, chainId } = useAccount();

  const tokenAddress = chainId ? getAI3TokenAddress(chainId) : undefined;

  const { data: ai3Balance, isLoading } = useBalance({
    address,
    token: tokenAddress as Address,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  return {
    balance: ai3Balance,
    isLoading,
  };
}

/**
 * Calculate payment amount in AI3 tokens
 */
export function calculatePaymentAmount(
  plan: SubscriptionPlan,
  duration: 'monthly' | 'yearly'
): bigint {
  return calculatePriceInAI3(plan, duration);
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
 * Format AI3 payment amount for display (shows tAI3 for testnet, AI3 for mainnet)
 */
export function formatPaymentAmount(amount: bigint): string {
  // AI3 has 18 decimals
  const ai3 = Number(amount) / 1e18;
  const tokenName = getAI3TokenName();
  return `${ai3.toFixed(2)} ${tokenName}`;
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
