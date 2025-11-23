/**
 * Polkadot wallet connection component
 * Used for connecting to Autonomys Network via Substrate wallets
 */

"use client";

import {
  getWalletBySource,
  getWallets,
  type Wallet,
} from "@talismn/connect-wallets";
import { useEffect, useState } from "react";

interface PolkadotAccount {
  address: string;
  name?: string;
  source: string;
}

export function PolkadotWalletConnect() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [accounts, setAccounts] = useState<PolkadotAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<PolkadotAccount | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get all supported wallets
    const supportedWallets = getWallets();
    setWallets(supportedWallets);
  }, []);

  const connectWallet = async (wallet: Wallet) => {
    try {
      // Enable wallet
      await wallet.enable("AI Memory Box");

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
      console.log("Connected to Polkadot wallet:", wallet.extensionName);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert(
        "Failed to connect wallet. Make sure the extension is installed and unlocked."
      );
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
        <div className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white">
          {selectedWallet.title}
        </div>
        <div className="relative">
          <button
            className="rounded-lg bg-gray-700 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedAccount.name || formatAddress(selectedAccount.address)}
          </button>

          {isOpen && (
            <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-gray-200 border-b p-4 dark:border-gray-700">
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Connected Account
                </p>
                <p className="mt-1 font-mono text-sm">
                  {selectedAccount.address}
                </p>
              </div>

              {accounts.length > 1 && (
                <div className="border-gray-200 border-b p-2 dark:border-gray-700">
                  <p className="mb-2 px-2 text-gray-600 text-xs dark:text-gray-400">
                    Switch Account
                  </p>
                  {accounts.map((account) => (
                    <button
                      className={`w-full rounded px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedAccount.address === account.address
                          ? "bg-gray-100 dark:bg-gray-700"
                          : ""
                      }`}
                      key={account.address}
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsOpen(false);
                      }}
                    >
                      <div className="text-sm">{account.name || "Account"}</div>
                      <div className="font-mono text-gray-500 text-xs">
                        {formatAddress(account.address)}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2">
                <button
                  className="w-full rounded px-3 py-2 text-red-600 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    disconnectWallet();
                    setIsOpen(false);
                  }}
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
        className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        Connect Polkadot Wallet
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-gray-200 border-b p-4 dark:border-gray-700">
            <h3 className="font-semibold">Select Wallet</h3>
            <p className="mt-1 text-gray-600 text-xs dark:text-gray-400">
              Connect with a Polkadot wallet
            </p>
          </div>

          <div className="p-2">
            {wallets.map((wallet) => (
              <button
                className={`flex w-full items-center gap-3 rounded px-3 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  wallet.installed ? "" : "cursor-not-allowed opacity-50"
                }`}
                disabled={!wallet.installed}
                key={wallet.extensionName}
                onClick={() => {
                  connectWallet(wallet);
                  setIsOpen(false);
                }}
              >
                {wallet.logo?.src && (
                  <img
                    alt={wallet.logo.alt}
                    className="h-8 w-8 rounded"
                    src={wallet.logo.src}
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{wallet.title}</div>
                  {!wallet.installed && (
                    <div className="text-red-600 text-xs">Not installed</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {wallets.length === 0 && (
            <div className="p-4 text-center text-gray-600 text-sm dark:text-gray-400">
              No Polkadot wallets found. Please install a wallet extension.
            </div>
          )}

          <div className="border-gray-200 border-t p-4 text-gray-600 text-xs dark:border-gray-700 dark:text-gray-400">
            <p>
              Don't have a wallet?{" "}
              <a
                className="text-purple-600 hover:underline"
                href="https://polkadot.js.org/extension/"
                rel="noopener noreferrer"
                target="_blank"
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
