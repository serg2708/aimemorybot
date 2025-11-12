/**
 * Client-side providers wrapper
 * Loads Web3 providers only on the client to avoid SSR issues
 */

'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamic import for Web3 Providers to avoid SSR issues with indexedDB
const Providers = dynamic(
  () => import('@/components/providers').then((mod) => mod.Providers),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <Providers>{children}</Providers>;
}
