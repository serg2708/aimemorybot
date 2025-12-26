/**
 * Network status indicator with balance display
 * Shows current network (Mainnet/Testnet), AI3/tAI3 balance, and network switcher
 */

"use client";

import { useState } from "react";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import {
  autonomysAutoEVM,
  getAI3TokenAddress,
  getAI3TokenName,
} from "@/lib/web3";
import { Button } from "./ui/button";

export function NetworkStatus() {
  const { address, chain, isConnected } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const [isExpanded, setIsExpanded] = useState(false);

  const tokenAddress = chain?.id ? getAI3TokenAddress(chain.id) : undefined;

  const { data: balance, isLoading } = useBalance({
    address,
    token: tokenAddress as `0x${string}`,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  const tokenName = getAI3TokenName();
  const isTestnet = process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK === "testnet";

  if (!isConnected) {
    return null;
  }

  const networkColor = isTestnet ? "bg-orange-500" : "bg-green-500";
  const networkName = isTestnet ? "Testnet (Chronos)" : "Mainnet";

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Network indicator dot */}
        <div className={`h-2 w-2 rounded-full ${networkColor} animate-pulse`} />

        {/* Network name */}
        <span className="hidden font-medium text-sm md:inline">
          {chain?.name || networkName}
        </span>

        {/* Balance */}
        {balance && (
          <span className="font-semibold text-blue-600 text-sm dark:text-blue-400">
            {Number.parseFloat(balance.formatted).toFixed(2)} {tokenName}
          </span>
        )}

        {isLoading && <span className="text-gray-500 text-xs">Loading...</span>}

        {/* Dropdown arrow */}
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isExpanded && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {/* Current Network */}
            <div className="mb-4">
              <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
                Current Network
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${networkColor}`} />
                <span className="font-medium text-sm">{networkName}</span>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
                Balance
              </div>
              {balance ? (
                <div className="font-bold text-blue-600 text-lg dark:text-blue-400">
                  {Number.parseFloat(balance.formatted).toFixed(4)} {tokenName}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Not available</div>
              )}
            </div>

            {/* Chain info */}
            <div className="mb-4">
              <div className="mb-1 text-gray-500 text-xs dark:text-gray-400">
                Chain ID
              </div>
              <div className="font-mono text-sm">
                {chain?.id || autonomysAutoEVM.id}
              </div>
            </div>

            {/* Network switcher */}
            {chains && chains.length > 1 && (
              <div className="border-gray-200 border-t pt-3 dark:border-gray-700">
                <div className="mb-2 text-gray-500 text-xs dark:text-gray-400">
                  Switch Network
                </div>
                <div className="space-y-2">
                  {chains.map((availableChain) => (
                    <Button
                      className="w-full text-sm"
                      disabled={chain?.id === availableChain.id}
                      key={availableChain.id}
                      onClick={() => {
                        switchChain?.({ chainId: availableChain.id });
                        setIsExpanded(false);
                      }}
                      variant={
                        chain?.id === availableChain.id ? "default" : "outline"
                      }
                    >
                      {availableChain.name}
                      {chain?.id === availableChain.id && " ✓"}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Explorer link */}
            {chain?.blockExplorers?.default && address && (
              <div className="mt-3 border-gray-200 border-t pt-3 dark:border-gray-700">
                <a
                  className="text-blue-600 text-xs hover:underline dark:text-blue-400"
                  href={`${chain.blockExplorers.default.url}/address/${address}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View on {chain.blockExplorers.default.name} →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact network badge (for mobile/small spaces)
 */
export function NetworkBadge() {
  const { chain, isConnected } = useAccount();
  const isTestnet = process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK === "testnet";

  if (!isConnected) return null;

  const networkColor = isTestnet ? "bg-orange-500" : "bg-green-500";
  const networkName = isTestnet ? "Testnet" : "Mainnet";

  return (
    <div className="flex items-center gap-1.5 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
      <div className={`h-1.5 w-1.5 rounded-full ${networkColor}`} />
      <span className="font-medium">{networkName}</span>
    </div>
  );
}
