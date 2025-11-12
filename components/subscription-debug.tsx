/**
 * Subscription Debug Component
 * Displays diagnostic information for subscription issues
 */

'use client';

import { useAccount, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, autonomysAutoEVM } from '@/lib/web3';
import { useSubscription } from '@/lib/subscription';

export function SubscriptionDebug() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { subscription, isLoading, error } = useSubscription();

  const contractAddress = chainId
    ? CONTRACT_ADDRESSES.subscription[chainId as keyof typeof CONTRACT_ADDRESSES.subscription]
    : undefined;

  const expectedChainId = autonomysAutoEVM.id;
  const isCorrectNetwork = chainId === expectedChainId;

  // Check if in mock mode
  const isMockMode = !contractAddress || contractAddress === '' ||
    process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION === 'true';

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 border-2 border-red-500 rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-red-600">Debug Info</h3>
        <button
          onClick={() => {
            const el = document.getElementById('subscription-debug');
            if (el) el.style.display = 'none';
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-sm font-mono">
        {/* Wallet Connection */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-semibold mb-1">Wallet Connection:</div>
          <div className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '✓ Connected' : '✗ Not Connected'}
          </div>
          {address && (
            <div className="text-xs mt-1 break-all">
              {address}
            </div>
          )}
        </div>

        {/* Network */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-semibold mb-1">Network:</div>
          <div>
            <span className="text-gray-600">Current:</span> {chain?.name || 'Unknown'} (ID: {chainId})
          </div>
          <div>
            <span className="text-gray-600">Expected:</span> {autonomysAutoEVM.name} (ID: {expectedChainId})
          </div>
          <div className={isCorrectNetwork ? 'text-green-600' : 'text-red-600 font-bold'}>
            {isCorrectNetwork ? '✓ Correct Network' : '✗ Wrong Network - Switch to ' + autonomysAutoEVM.name}
          </div>
        </div>

        {/* Mock Mode Status */}
        {isMockMode && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-500 rounded">
            <div className="font-semibold mb-1 text-yellow-700 dark:text-yellow-400">
              ⚠️ Mock Mode Active
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-300">
              Subscriptions are simulated (saved in browser). Deploy contract to use real blockchain transactions.
            </div>
          </div>
        )}

        {/* Contract Address */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-semibold mb-1">Subscription Contract:</div>
          {contractAddress ? (
            <div className="text-green-600 break-all">
              ✓ {contractAddress}
            </div>
          ) : (
            <div className="text-orange-600">
              ⚠️ Not configured - Using Mock Mode
            </div>
          )}
        </div>

        {/* Subscription Status */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-semibold mb-1">Subscription Status:</div>
          {isLoading ? (
            <div className="text-yellow-600">Loading...</div>
          ) : error ? (
            <div className="text-red-600">
              ✗ Error: {error.message}
            </div>
          ) : subscription ? (
            <div className="text-green-600">
              ✓ Plan: {subscription.plan}, Active: {subscription.isActive ? 'Yes' : 'No'}
            </div>
          ) : (
            <div className="text-gray-600">No subscription data</div>
          )}
        </div>

        {/* Environment */}
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="font-semibold mb-1">Environment:</div>
          <div>
            <span className="text-gray-600">Network Mode:</span>{' '}
            {process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK || 'not set'}
          </div>
          <div>
            <span className="text-gray-600">WalletConnect:</span>{' '}
            {process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? '✓' : '✗ Missing'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {isMockMode && (
            <a
              href="https://github.com/serg2708/aimemorybot/blob/main/contracts/DEPLOYMENT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-center rounded text-xs font-semibold"
            >
              📖 Deploy Contract Guide
            </a>
          )}
          <button
            onClick={() => {
              console.log('=== SUBSCRIPTION DEBUG INFO ===');
              console.log('Wallet:', { address, isConnected, chain });
              console.log('Network:', { chainId, expectedChainId, isCorrectNetwork });
              console.log('Contract:', contractAddress);
              console.log('Mock Mode:', isMockMode);
              console.log('Subscription:', { subscription, isLoading, error });
              console.log('Environment:', {
                network: process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK,
                walletConnect: !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
                mockMode: process.env.NEXT_PUBLIC_MOCK_SUBSCRIPTION,
              });
            }}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            Log Full Debug Info to Console
          </button>
        </div>
      </div>
    </div>
  );
}
