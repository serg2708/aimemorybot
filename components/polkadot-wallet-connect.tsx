/**
 * Polkadot wallet connection component
 * Used for connecting to Autonomys Network via Substrate wallets
 * Uses dynamic import to avoid SSR issues
 */

'use client';

import { useState, useEffect } from 'react';

// Type definitions for Talisman wallet
type Wallet = {
  extensionName: string;
  title: string;
  installed?: boolean;
  logo?: {
    src: string;
    alt: string;
  };
  enable: (appName: string) => Promise<void>;
  subscribeAccounts: (callback: (accounts: any[]) => void) => Promise<void>;
};

interface PolkadotAccount {
  address: string;
  name?: string;
  source: string;
}

export function PolkadotWalletConnect() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [accounts, setAccounts] = useState<PolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PolkadotAccount | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import of Talisman wallet library to avoid SSR issues
    const loadWallets = async () => {
      try {
        setIsLoading(true);
        // Only load on client-side
        if (typeof window === 'undefined') return;

        const { getWallets } = await import('@talismn/connect-wallets');
        const supportedWallets = getWallets();
        setWallets(supportedWallets);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load Polkadot wallets:', error);
        setLoadError('Failed to load wallet library. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, []);

  const connectWallet = async (wallet: Wallet) => {
    try {
      // Enable wallet
      await wallet.enable('AI Memory Box');

      // Get accounts
      await wallet.subscribeAccounts((accounts) => {
        if (accounts) {
          const polkadotAccounts: PolkadotAccount[] = accounts.map((acc) => ({
            address: acc.address,
            name: acc.name,
            source: wallet.extensionName,
          }));
          setAccounts(polkadotAccounts);

          // Auto-select first account if available
          if (polkadotAccounts.length > 0) {
            setSelectedAccount(polkadotAccounts[0]);
          }
        }
      });

      setSelectedWallet(wallet);
      console.log('Connected to Polkadot wallet:', wallet.extensionName);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Make sure the extension is installed and unlocked.');
    }
  };

  const disconnectWallet = () => {
    setSelectedWallet(null);
    setAccounts([]);
    setSelectedAccount(null);
  };

  const formatAddress = (address: string, length = 6): string => {
    if (!address || address.length < length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  if (selectedWallet && selectedAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">
          {selectedWallet.title}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            {selectedAccount.name || formatAddress(selectedAccount.address)}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Connected Account</p>
                <p className="text-sm font-mono mt-1">{selectedAccount.address}</p>
              </div>

              {accounts.length > 1 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 px-2 mb-2">
                    Switch Account
                  </p>
                  {accounts.map((account) => (
                    <button
                      key={account.address}
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedAccount.address === account.address
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <div className="text-sm">{account.name || 'Account'}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {formatAddress(account.address)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2">
                <button
                  onClick={() => {
                    disconnectWallet();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Connect Polkadot Wallet'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Select Wallet</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Connect with a Polkadot wallet
            </p>
          </div>

          {loadError && (
            <div className="p-4 text-center text-sm text-red-600">
              {loadError}
            </div>
          )}

          {isLoading && (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Loading wallets...
            </div>
          )}

          {!isLoading && !loadError && (
            <>
              <div className="p-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.extensionName}
                    onClick={() => {
                      connectWallet(wallet);
                      setIsOpen(false);
                    }}
                    disabled={!wallet.installed}
                    className={`w-full text-left px-3 py-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                      !wallet.installed ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {wallet.logo?.src && (
                      <img
                        src={wallet.logo.src}
                        alt={wallet.logo.alt}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{wallet.title}</div>
                      {!wallet.installed && (
                        <div className="text-xs text-red-600">Not installed</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {wallets.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  No Polkadot wallets found. Please install a wallet extension.
                </div>
              )}
            </>
          )}

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            <p>
              Don't have a wallet?{' '}
              <a
                href="https://polkadot.js.org/extension/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                Install Polkadot.js
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to use Polkadot wallet state
 */
export function usePolkadotWallet() {
  const [account, setAccount] = useState<PolkadotAccount | null>(null);

  // This would need to be implemented with context or state management
  // For now, return placeholder
  return {
    account,
    isConnected: !!account,
    connect: async () => {},
    disconnect: () => {},
  };
}
