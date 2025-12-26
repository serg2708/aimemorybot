/**
 * Re-export wagmi hooks
 * Pages using these hooks are now dynamically imported with ssr: false
 */

"use client";

export { useAccount, useBalance } from "wagmi";
