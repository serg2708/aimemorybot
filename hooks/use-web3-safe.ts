/**
 * SSR-safe Web3 hooks
 * Returns null during SSR, actual values after client mount
 */

'use client';

import { useEffect, useState } from 'react';
import { useAccount as useWagmiAccount, useBalance as useWagmiBalance } from 'wagmi';
import type { UseAccountReturnType, UseBalanceReturnType } from 'wagmi';

/**
 * SSR-safe useAccount hook
 * Returns null values during SSR, actual account data after mount
 */
export function useAccount() {
  const [isMounted, setIsMounted] = useState(false);
  const account = useWagmiAccount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return {
      address: undefined,
      addresses: undefined,
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      isReconnecting: false,
      status: 'disconnected' as const,
    } as UseAccountReturnType;
  }

  return account;
}

/**
 * SSR-safe useBalance hook
 * Returns null values during SSR, actual balance data after mount
 */
export function useBalance(args?: Parameters<typeof useWagmiBalance>[0]) {
  const [isMounted, setIsMounted] = useState(false);
  const balance = useWagmiBalance(args);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return {
      data: undefined,
      error: null,
      isError: false,
      isLoading: true,
      isSuccess: false,
      status: 'pending' as const,
    } as UseBalanceReturnType;
  }

  return balance;
}
