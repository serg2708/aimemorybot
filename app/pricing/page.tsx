"use client";

import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues
const PricingClient = dynamic(
  () => import("./pricing-client").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p>Loading pricing...</p>
        </div>
      </div>
    ),
  }
);

export default function PricingPage() {
  return <PricingClient />;
}
