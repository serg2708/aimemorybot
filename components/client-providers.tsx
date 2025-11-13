/**
 * Client-side providers wrapper
 * Wraps app with Web3 providers (wagmi, RainbowKit, theme)
 */

'use client';

import { Providers } from '@/components/providers';
import type { ReactNode } from 'react';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <Providers>{children}</Providers>;
}
