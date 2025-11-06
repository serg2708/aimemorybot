/**
 * Web3 configuration for RainbowKit and wagmi
 * Autonomys Network only - for AI3 token payments and DSN storage
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Autonomys Network (Substrate-based, for DSN storage)
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

// Autonomys Auto EVM (EVM-compatible, for AI3 token payments)
export const autonomysAutoEVM = {
  id: 490001, // Replace with actual chain ID
  name: 'Autonomys Auto EVM',
  nativeCurrency: {
    decimals: 18,
    name: 'AUTO',
    symbol: 'AUTO',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_AUTONOMYS_AUTO_EVM_RPC || 'https://auto-evm-rpc.autonomys.xyz'],
      webSocket: [process.env.NEXT_PUBLIC_AUTONOMYS_AUTO_EVM_WS || 'wss://auto-evm-ws.autonomys.xyz'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_AUTONOMYS_AUTO_EVM_RPC || 'https://auto-evm-rpc.autonomys.xyz'],
      webSocket: [process.env.NEXT_PUBLIC_AUTONOMYS_AUTO_EVM_WS || 'wss://auto-evm-ws.autonomys.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Autonomys Auto EVM Explorer',
      url: 'https://auto-evm-explorer.autonomys.xyz',
    },
  },
  testnet: false,
} as const;

/**
 * Get RainbowKit/wagmi configuration - Autonomys Networks only
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
      autonomys as any, // Autonomys Network (Substrate)
      autonomysAutoEVM as any, // Autonomys Auto EVM
    ],
    ssr: true, // Enable server-side rendering
  });
};

/**
 * Supported networks - Autonomys only
 */
export const NETWORKS = {
  // For AI3 token payments
  payment: [autonomysAutoEVM],
  // For DSN storage
  storage: [autonomys],
  // All supported networks
  all: [autonomys, autonomysAutoEVM],
} as const;

/**
 * Contract addresses - Autonomys Networks only
 */
export const CONTRACT_ADDRESSES = {
  // Subscription contract on Autonomys Auto EVM
  subscription: {
    [autonomysAutoEVM.id]: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM || '',
  },
  // Storage contract on Autonomys Network
  storage: {
    [autonomys.id]: process.env.NEXT_PUBLIC_AUTONOMYS_STORAGE_CONTRACT || '',
  },
} as const;

/**
 * AI3 Token addresses - Autonomys Networks only
 */
export const TOKEN_ADDRESSES = {
  AI3: {
    // AI3 on Autonomys Network (Substrate)
    [autonomys.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_AUTONOMYS || '',
    // AI3 on Autonomys Auto EVM
    [autonomysAutoEVM.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_AUTO_EVM || '',
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
 * Get chain name from chain ID - Autonomys only
 */
export function getChainName(chainId: number): string {
  const chains = [autonomys, autonomysAutoEVM];
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
