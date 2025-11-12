/**
 * Network status indicator with balance display
 * Shows current network (Mainnet/Testnet), AI3/tAI3 balance, and network switcher
 */

'use client';

import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { autonomysAutoEVM } from '@/lib/web3';
import { getAI3TokenName, getAI3TokenAddress } from '@/lib/web3';
import { useState } from 'react';
import { Button } from './ui/button';

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
  const isTestnet = process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK === 'testnet';

  if (!isConnected) {
    return null;
  }

  const networkColor = isTestnet ? 'bg-orange-500' : 'bg-green-500';
  const networkName = isTestnet ? 'Testnet (Chronos)' : 'Mainnet';

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Network indicator dot */}
        <div className={`w-2 h-2 rounded-full ${networkColor} animate-pulse`} />

        {/* Network name */}
        <span className="text-sm font-medium hidden md:inline">
          {chain?.name || networkName}
        </span>

        {/* Balance */}
        {balance && (
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {parseFloat(balance.formatted).toFixed(2)} {tokenName}
          </span>
        )}

        {isLoading && (
          <span className="text-xs text-gray-500">Loading...</span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            {/* Current Network */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Network</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${networkColor}`} />
                <span className="text-sm font-medium">{networkName}</span>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</div>
              {balance ? (
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(balance.formatted).toFixed(4)} {tokenName}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Not available</div>
              )}
            </div>

            {/* Chain info */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Chain ID</div>
              <div className="text-sm font-mono">{chain?.id || autonomysAutoEVM.id}</div>
            </div>

            {/* Network switcher */}
            {chains && chains.length > 1 && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Switch Network</div>
                <div className="space-y-2">
                  {chains.map((availableChain) => (
                    <Button
                      key={availableChain.id}
                      onClick={() => {
                        switchChain?.({ chainId: availableChain.id });
                        setIsExpanded(false);
                      }}
                      disabled={chain?.id === availableChain.id}
                      variant={chain?.id === availableChain.id ? 'default' : 'outline'}
                      className="w-full text-sm"
                    >
                      {availableChain.name}
                      {chain?.id === availableChain.id && ' ✓'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Explorer link */}
            {chain?.blockExplorers?.default && address && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                <a
                  href={`${chain.blockExplorers.default.url}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
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
  const isTestnet = process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK === 'testnet';

  if (!isConnected) return null;

  const networkColor = isTestnet ? 'bg-orange-500' : 'bg-green-500';
  const networkName = isTestnet ? 'Testnet' : 'Mainnet';

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${networkColor}`} />
      <span className="font-medium">{networkName}</span>
    </div>
  );
}
