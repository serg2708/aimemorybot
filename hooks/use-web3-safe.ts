/**
 * Safe wrapper for wagmi hooks
 * Provides fallback values when WagmiProvider is not available (fallback mode)
 * Pages using these hooks are now dynamically imported with ssr: false
 */

"use client";

import { useAccount as useWagmiAccount, useBalance as useWagmiBalance } from "wagmi";
import type { UseAccountReturnType, UseBalanceReturnType } from "wagmi";

/**
 * Safe wrapper for useAccount hook
 * Returns default values when provider is not available
 */
export function useAccount(): UseAccountReturnType {
  try {
    return useWagmiAccount();
  } catch (error) {
    // Provider not available - return safe defaults
    console.warn("[use-web3-safe] WagmiProvider not available, using fallback values");
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
      status: "disconnected",
    } as UseAccountReturnType;
  }
}

/**
 * Safe wrapper for useBalance hook
 * Returns default values when provider is not available
 */
export function useBalance(parameters?: Parameters<typeof useWagmiBalance>[0]): ReturnType<typeof useWagmiBalance> {
  try {
    return useWagmiBalance(parameters);
  } catch (error) {
    // Provider not available - return safe defaults
    console.warn("[use-web3-safe] WagmiProvider not available, using fallback values");
    return {
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      isPlaceholderData: false,
      status: "error",
      fetchStatus: "idle",
      dataUpdatedAt: 0,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: false,
      isInitialLoading: false,
      isRefetching: false,
      isStale: false,
      isPaused: false,
      isEnabled: false,
      refetch: async () => ({} as any),
      promise: Promise.resolve({} as any),
      queryKey: [] as readonly unknown[],
    } as ReturnType<typeof useWagmiBalance>;
  }
}
