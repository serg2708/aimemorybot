/**
 * Web3 configuration for RainbowKit and wagmi
 * Autonomys Network only - for AI3 token payments and DSN storage
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Helper function to determine network (safe to call on both client and server)
const getIsTestnet = () => {
  // Always use env variable directly - works on both server and client
  return process.env.NEXT_PUBLIC_AUTONOMYS_NETWORK === "testnet";
};

// Autonomys Auto EVM (EVM-compatible, for AI3 token payments)
// Use NEXT_PUBLIC_AUTONOMYS_NETWORK=mainnet or testnet (default: mainnet)
// Use function to avoid SSR/client mismatch
const isTestnet = getIsTestnet();

export const autonomysAutoEVM = defineChain({
  id: isTestnet ? 8700 : 870, // Testnet (Chronos): 8700, Mainnet: 870
  name: isTestnet ? "AutoEVM Testnet (Chronos)" : "AutoEVM Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: isTestnet ? "tAI3" : "AI3",
    symbol: isTestnet ? "tAI3" : "AI3",
  },
  rpcUrls: {
    default: {
      http: [
        isTestnet
          ? "https://rpc-0.chronos.autonomys.xyz"
          : "https://auto-evm.mainnet.autonomys.xyz",
      ],
      webSocket: [
        isTestnet
          ? "wss://auto-evm.chronos.autonomys.xyz/ws"
          : "wss://auto-evm.mainnet.autonomys.xyz/ws",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: isTestnet
        ? "AutoEVM Explorer (Chronos)"
        : "AutoEVM Explorer (Mainnet)",
      url: isTestnet
        ? "https://explorer.auto-evm.chronos.autonomys.xyz"
        : "https://explorer.mainnet.autonomys.xyz",
    },
  },
  testnet: isTestnet,
});

// Autonomys Network (Substrate-based, for DSN storage)
// Note: NOT used with wagmi/RainbowKit as it's not EVM-compatible
export const autonomys = {
  id: 490_000,
  name: "Autonomys Network",
  nativeCurrency: {
    decimals: 18,
    name: "AUTO",
    symbol: "AUTO",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-chronos.autonomys.xyz"],
      webSocket: ["wss://rpc-chronos.autonomys.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Autonomys Explorer",
      url: "https://explorer.autonomys.xyz",
    },
  },
  testnet: false,
} as const;

/**
 * Get RainbowKit/wagmi configuration - Autonomys Networks only
 * Includes error handling for external API failures (e.g., Coinbase Analytics)
 */
export const getWeb3Config = () => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId) {
    console.warn("[Web3] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set");
  }

  try {
    console.log("[Web3] Initializing RainbowKit config...");

    // Wrap getDefaultConfig in a try-catch to handle Coinbase Analytics failures
    let config;
    try {
      config = getDefaultConfig({
        appName: "AI Memory Box",
        projectId: projectId || "YOUR_PROJECT_ID", // Fallback for development
        chains: [autonomysAutoEVM], // Autonomys Auto EVM (EVM-compatible only)
        ssr: false, // Disable SSR to avoid indexedDB errors on server
      });
    } catch (initError) {
      // Log the initialization error but continue anyway
      console.warn("[Web3] getDefaultConfig encountered an error (likely Coinbase Analytics):", initError);

      // Re-throw to trigger fallback mode
      throw initError;
    }

    console.log("[Web3] RainbowKit config initialized successfully");
    return config;
  } catch (error) {
    console.error("[Web3] Failed to initialize RainbowKit config:", error);

    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error("[Web3] Error name:", error.name);
      console.error("[Web3] Error message:", error.message);

      // Check if it's a network-related error (e.g., Coinbase Analytics API 503)
      if (
        error.message.includes("fetch") ||
        error.message.includes("503") ||
        error.message.includes("network") ||
        error.message.includes("Coinbase") ||
        error.message.includes("coinbase") ||
        error.message.includes("analytics") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        console.warn(
          "[Web3] External service error detected (Coinbase Analytics or similar) - continuing in fallback mode"
        );
      }
    }

    // Re-throw the error so it can be caught by the Providers component
    throw error;
  }
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
    [autonomysAutoEVM.id]:
      process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT_AUTO_EVM || "",
  },
  // Storage contract on Autonomys Network
  storage: {
    [autonomys.id]: process.env.NEXT_PUBLIC_AUTONOMYS_STORAGE_CONTRACT || "",
  },
} as const;

/**
 * AI3 Token addresses - Autonomys Networks only
 */
export const TOKEN_ADDRESSES = {
  AI3: {
    // AI3 on Autonomys Network (Substrate)
    [autonomys.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_AUTONOMYS || "",
    // AI3 on Autonomys Auto EVM
    [autonomysAutoEVM.id]: process.env.NEXT_PUBLIC_AI3_TOKEN_AUTO_EVM || "",
  },
} as const;

/**
 * Get supported tokens for a chain - AI3 only
 */
export function getSupportedTokens(chainId: number): string[] {
  const tokenAddress =
    TOKEN_ADDRESSES.AI3[chainId as keyof typeof TOKEN_ADDRESSES.AI3];

  if (tokenAddress) {
    return ["AI3"];
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
 * Get token name based on network (tAI3 for testnet, AI3 for mainnet)
 */
export function getAI3TokenName(): string {
  return isTestnet ? "tAI3" : "AI3";
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
  if (!address) return "";
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
  return chain?.name || "Unknown";
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
  const weiValue = typeof wei === "string" ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);
  const ether = Number(weiValue) / Number(divisor);
  return ether.toFixed(6);
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string, decimals = 18): bigint {
  const multiplier = BigInt(10 ** decimals);
  const etherValue = Number.parseFloat(ether);
  return BigInt(Math.floor(etherValue * Number(multiplier)));
}
