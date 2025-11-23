/**
 * Providers component
 * Wraps the app with all necessary providers: ThemeProvider, WagmiProvider, RainbowKit, QueryClient
 * Single unified provider component - no complex nesting or dynamic imports
 */

"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  lightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { getWeb3Config } from "@/lib/web3";

interface ProvidersProps {
  children: ReactNode;
}

// Error screen component
function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h2 className="mb-4 font-bold text-red-800 text-xl dark:text-red-200">
          Web3 Configuration Error
        </h2>
        <p className="mb-4 text-red-700 text-sm dark:text-red-300">
          Failed to initialize Web3 providers. Please check your configuration.
        </p>
        <details className="text-sm">
          <summary className="mb-2 cursor-pointer font-medium text-red-600 dark:text-red-400">
            Error Details
          </summary>
          <pre className="overflow-auto whitespace-pre-wrap rounded bg-red-100 p-3 text-red-700 text-xs dark:bg-red-900/40 dark:text-red-300">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}

export function Providers({ children }: ProvidersProps) {
  // Single mount check to ensure we're on the client
  const [mounted, setMounted] = useState(false);
  const [wagmiConfig] = useState(() => {
    // Initialize config once during component initialization
    try {
      return getWeb3Config();
    } catch (err) {
      console.error("[Providers] Failed to initialize Web3:", err);
      return null;
    }
  });

  // Create QueryClient only once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show error screen if config creation failed
  if (!wagmiConfig) {
    return <ErrorScreen error={new Error("Failed to create Web3 config")} />;
  }

  // Render all providers in a single tree
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            modalSize="compact"
            theme={{
              lightMode: lightTheme(),
              darkMode: darkTheme(),
            }}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
