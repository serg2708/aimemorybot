/**
 * Providers component
 * Wraps the app with necessary providers (wagmi, RainbowKit, theme, etc.)
 */

'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWeb3Config } from '@/lib/web3';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<ReturnType<typeof getWeb3Config> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    try {
      // Create config only on client side
      const wagmiConfig = getWeb3Config();
      console.log('[Providers] Config created successfully:', wagmiConfig);
      setConfig(wagmiConfig);
      setMounted(true);
    } catch (err) {
      console.error('[Providers] Failed to create config:', err);
      setError(err as Error);
    }
  }, []);

  // Show error if config creation failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-2xl w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">
            Configuration Error
          </h2>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </div>
      </div>
    );
  }

  // During SSR or before mount, show loading screen
  // This prevents wagmi hooks from being called before providers are ready
  if (!mounted || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('[Providers] Rendering with config, mounted:', mounted);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
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
