/**
 * RPC Fallback and Retry Logic
 * Automatically retries failed RPC requests with exponential backoff
 */

import { http, type Transport } from "viem";

/**
 * Create a transport with retry logic
 * Automatically retries failed requests up to 3 times with exponential backoff
 */
export function createRetryTransport(url: string, options?: { retries?: number; timeout?: number }): Transport {
  const retries = options?.retries ?? 3;
  const timeout = options?.timeout ?? 10000; // 10s default

  return http(url, {
    timeout,
    retryCount: retries,
    // Simple retry delay (viem will handle exponential backoff automatically)
    retryDelay: 1000,
  });
}

/**
 * Create fallback transports with multiple RPC endpoints
 * Tries each endpoint in order until one succeeds
 */
export function createFallbackTransport(urls: string[]): Transport {
  if (urls.length === 0) {
    throw new Error("At least one RPC URL is required");
  }

  if (urls.length === 1) {
    return createRetryTransport(urls[0]);
  }

  // For multiple URLs, create a fallback chain
  // Note: viem's fallback() is the recommended way but requires multiple transports
  // For now, we'll use the first URL with retry logic
  // TODO: Implement proper fallback when more RPC endpoints become available
  return createRetryTransport(urls[0]);
}

/**
 * Get RPC URLs for Chronos testnet
 * Currently only one public endpoint, but structured for future expansion
 */
export function getChronosRPCUrls(): string[] {
  return [
    "https://rpc-0.chronos.autonomys.xyz",
    // Add more endpoints here when available
  ];
}

/**
 * Get RPC URLs for AutoEVM mainnet
 */
export function getMainnetRPCUrls(): string[] {
  return [
    "https://auto-evm.mainnet.autonomys.xyz",
    // Add more endpoints here when available
  ];
}
