/**
 * Client-side providers wrapper
 * Simple re-export of Providers for use in root layout
 */

"use client";

import type { ReactNode } from "react";
import { Providers } from "@/components/providers";

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * ClientProviders is a thin wrapper around Providers
 * Used in root layout to ensure all providers are client-side
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <Providers>{children}</Providers>;
}
