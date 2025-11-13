/**
 * Providers component
 * Wraps the app with all necessary providers: ThemeProvider, WagmiProvider, RainbowKit, QueryClient
 * Single unified provider component - no complex nesting or dynamic imports
 */

'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { ThemeProvider } from 'next-themes';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWeb3Config } from '@/lib/web3';
import { useState, useEffect, type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Web3...</p>
      </div>
    </div>
  );
}

// Error screen component
function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-2xl w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">
          Web3 Configuration Error
        </h2>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
          Failed to initialize Web3 providers. Please check your configuration.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer text-red-600 dark:text-red-400 font-medium mb-2">
            Error Details
          </summary>
          <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-auto bg-red-100 dark:bg-red-900/40 p-3 rounded">
            {error.message}
            {'\n\n'}
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
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof getWeb3Config> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Create QueryClient only once
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    // Initialize Web3 config on client side only
    try {
      const config = getWeb3Config();
      setWagmiConfig(config);
      setMounted(true);
    } catch (err) {
      console.error('[Providers] Failed to initialize Web3:', err);
      setError(err as Error);
      setMounted(true); // Still mark as mounted to show error
    }
  }, []);

  // Show loading screen during initial mount
  if (!mounted) {
    return <LoadingScreen />;
  }

  // Show error screen if config creation failed
  if (error || !wagmiConfig) {
    return <ErrorScreen error={error || new Error('Failed to create Web3 config')} />;
  }

  // Render all providers in a single tree
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme(),
              darkMode: darkTheme(),
            }}
            modalSize="compact"
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
