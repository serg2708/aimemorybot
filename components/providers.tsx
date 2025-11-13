/**
 * Providers component
 * Wraps the app with necessary providers (wagmi, RainbowKit, theme, etc.)
 */

'use client';

import { ThemeProvider } from 'next-themes';
import { useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

interface ProvidersProps {
  children: ReactNode;
}

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Dynamically import Web3Providers with no SSR
const Web3Providers = dynamic(
  () => import('./web3-providers').then(mod => mod.Web3Providers),
  {
    ssr: false,
    loading: () => <LoadingScreen />
  }
);

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or before mount, show loading screen
  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Providers>
        {children}
      </Web3Providers>
    </ThemeProvider>
  );
}
