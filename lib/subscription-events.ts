/**
 * Subscription Events Reader
 * Reads subscription history from blockchain events
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { type Address, type Log } from "viem";
import { SUBSCRIPTION_ABI, SubscriptionPlan } from "./contract";
import { CONTRACT_ADDRESSES } from "./web3";

export interface SubscriptionEvent {
  type: "subscribed" | "extended" | "cancelled";
  blockNumber: bigint;
  timestamp: number;
  transactionHash: string;
  plan?: SubscriptionPlan;
  duration?: bigint;
  expiresAt?: bigint;
  newExpiresAt?: bigint;
}

/**
 * Hook to fetch subscription events from blockchain
 */
export function useSubscriptionEvents() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address || !chainId || !publicClient) {
      setEvents([]);
      return;
    }

    const contractAddress = CONTRACT_ADDRESSES.subscription[
      chainId as keyof typeof CONTRACT_ADDRESSES.subscription
    ];

    if (!contractAddress) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();

        // Fetch events from the last ~30 days (assuming 12 second blocks)
        // 30 days * 24 hours * 60 minutes * 60 seconds / 12 seconds per block
        const blocksPerDay = (24 * 60 * 60) / 12;
        const daysToFetch = 30;
        const fromBlock = currentBlock - BigInt(Math.floor(blocksPerDay * daysToFetch));

        // Fetch all subscription events for this user
        const [subscribedLogs, extendedLogs, cancelledLogs] = await Promise.all([
          // Subscribed events
          publicClient.getLogs({
            address: contractAddress as Address,
            event: {
              type: "event",
              name: "Subscribed",
              inputs: [
                { type: "address", indexed: true, name: "user" },
                { type: "uint8", indexed: false, name: "plan" },
                { type: "uint256", indexed: false, name: "duration" },
                { type: "uint256", indexed: false, name: "expiresAt" },
              ],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),

          // SubscriptionExtended events
          publicClient.getLogs({
            address: contractAddress as Address,
            event: {
              type: "event",
              name: "SubscriptionExtended",
              inputs: [
                { type: "address", indexed: true, name: "user" },
                { type: "uint256", indexed: false, name: "duration" },
                { type: "uint256", indexed: false, name: "newExpiresAt" },
              ],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),

          // SubscriptionCancelled events
          publicClient.getLogs({
            address: contractAddress as Address,
            event: {
              type: "event",
              name: "SubscriptionCancelled",
              inputs: [{ type: "address", indexed: true, name: "user" }],
            },
            args: {
              user: address,
            },
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        // Parse and combine all events
        const allEvents: SubscriptionEvent[] = [];

        // Parse Subscribed events
        for (const log of subscribedLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          allEvents.push({
            type: "subscribed",
            blockNumber: log.blockNumber,
            timestamp: Number(block.timestamp),
            transactionHash: log.transactionHash,
            plan: (log.args as any).plan as SubscriptionPlan,
            duration: (log.args as any).duration as bigint,
            expiresAt: (log.args as any).expiresAt as bigint,
          });
        }

        // Parse SubscriptionExtended events
        for (const log of extendedLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          allEvents.push({
            type: "extended",
            blockNumber: log.blockNumber,
            timestamp: Number(block.timestamp),
            transactionHash: log.transactionHash,
            duration: (log.args as any).duration as bigint,
            newExpiresAt: (log.args as any).newExpiresAt as bigint,
          });
        }

        // Parse SubscriptionCancelled events
        for (const log of cancelledLogs) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          allEvents.push({
            type: "cancelled",
            blockNumber: log.blockNumber,
            timestamp: Number(block.timestamp),
            transactionHash: log.transactionHash,
          });
        }

        // Sort by block number (newest first)
        allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

        setEvents(allEvents);
      } catch (err) {
        console.error("Failed to fetch subscription events:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [address, chainId, publicClient]);

  return {
    events,
    isLoading,
    error,
  };
}

/**
 * Format subscription event for display
 */
export function formatSubscriptionEvent(event: SubscriptionEvent): string {
  switch (event.type) {
    case "subscribed":
      return `Subscribed to ${getPlanName(event.plan!)} plan`;
    case "extended":
      return "Extended subscription";
    case "cancelled":
      return "Cancelled subscription";
    default:
      return "Unknown event";
  }
}

/**
 * Get plan name from enum
 */
function getPlanName(plan: SubscriptionPlan): string {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return "FREE";
    case SubscriptionPlan.BASIC:
      return "BASIC";
    case SubscriptionPlan.PRO:
      return "PRO";
    case SubscriptionPlan.UNLIMITED:
      return "UNLIMITED";
    default:
      return "Unknown";
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: bigint): string {
  const days = Number(seconds) / (24 * 60 * 60);

  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years === 1 ? "1 year" : `${years} years`;
  }

  if (days >= 30) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }

  return days === 1 ? "1 day" : `${Math.floor(days)} days`;
}
