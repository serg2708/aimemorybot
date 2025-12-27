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
      isLoading: false,
      isSuccess: false,
      status: "error",
      fetchStatus: "idle",
      refetch: async () => ({ data: undefined, error: null, isError: false, isLoading: false, isSuccess: false, status: "error", fetchStatus: "idle" } as any),
    } as ReturnType<typeof useWagmiBalance>;
  }
}
