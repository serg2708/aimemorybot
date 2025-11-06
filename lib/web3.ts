/**
 * Web3 configuration for RainbowKit and wagmi
 * Supports both EVM chains (for payments) and Polkadot/Substrate (for Autonomys)
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, base, optimism } from 'wagmi/chains';

// Autonomys custom chain
export const autonomys = {
  id: 490000,
  name: 'Autonomys Network',
  nativeCurrency: {
    decimals: 18,
    name: 'AUTO',
    symbol: 'AUTO',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-chronos.autonomys.xyz'],
      webSocket: ['wss://rpc-chronos.autonomys.xyz'],
    },
    public: {
      http: ['https://rpc-chronos.autonomys.xyz'],
      webSocket: ['wss://rpc-chronos.autonomys.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Autonomys Explorer',
      url: 'https://explorer.autonomys.xyz',
    },
  },
  testnet: false,
} as const;

/**
 * Get RainbowKit/wagmi configuration
 */
export const getWeb3Config = () => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId) {
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set');
  }

  return getDefaultConfig({
    appName: 'AI Memory Box',
    projectId: projectId || 'YOUR_PROJECT_ID', // Fallback for development
    chains: [
      mainnet,
      polygon,
      arbitrum,
      base,
      optimism,
      autonomys as any, // Type assertion needed for custom chain
    ],
    ssr: true, // Enable server-side rendering
  });
};

/**
 * Supported networks for different operations
 */
export const NETWORKS = {
  // For payments
  payment: [mainnet, polygon, arbitrum, base, optimism],
  // For Autonomys DSN
  storage: [autonomys],
} as const;

/**
 * Contract addresses for different chains
 */
export const CONTRACT_ADDRESSES = {
  // Subscription contract on different chains
  subscription: {
    [mainnet.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_MAINNET || '',
    [polygon.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_POLYGON || '',
    [arbitrum.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_ARBITRUM || '',
    [base.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_BASE || '',
    [optimism.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_OPTIMISM || '',
  },
  // Autonomys-specific contracts
  autonomys: {
    storage: process.env.NEXT_PUBLIC_AUTONOMYS_STORAGE_CONTRACT || '',
  },
} as const;

/**
 * Token addresses for payments - AI3 Token only
 */
export const TOKEN_ADDRESSES = {
  AI3: {
    [mainnet.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_MAINNET || '',
    [polygon.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_POLYGON || '',
    [arbitrum.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_ARBITRUM || '',
    [base.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_BASE || '',
    [optimism.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_OPTIMISM || '',
  },
} as const;

/**
 * Get supported tokens for a chain - AI3 only
 */
export function getSupportedTokens(chainId: number): string[] {
  const tokenAddress = TOKEN_ADDRESSES.AI3[chainId as keyof typeof TOKEN_ADDRESSES.AI3];

  if (tokenAddress) {
    return ['AI3'];
  }

  return [];
}

/**
 * Get AI3 token address for a specific chain
 */
export function getAI3TokenAddress(chainId: number): string | undefined {
  const tokenAddresses = TOKEN_ADDRESSES.AI3 as Record<number, string>;
  return tokenAddresses[chainId];
}

/**
 * Get token decimals for AI3 (18 decimals)
 */
export function getAI3Decimals(): number {
  return 18;
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, length = 4): string {
  if (!address) return '';
  if (address.length < length * 2 + 2) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Check if a chain supports subscriptions
 */
export function isSubscriptionSupported(chainId: number): boolean {
  return !!CONTRACT_ADDRESSES.subscription[
    chainId as keyof typeof CONTRACT_ADDRESSES.subscription
  ];
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const chains = [mainnet, polygon, arbitrum, base, optimism, autonomys];
  const chain = chains.find((c) => c.id === chainId);
  return chain?.name || 'Unknown';
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: bigint | string, decimals = 18): string {
  const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);
  const ether = Number(weiValue) / Number(divisor);
  return ether.toFixed(6);
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string, decimals = 18): bigint {
  const multiplier = BigInt(10 ** decimals);
  const etherValue = parseFloat(ether);
  return BigInt(Math.floor(etherValue * Number(multiplier)));
}
