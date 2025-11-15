'use client';

import dynamic from 'next/dynamic';

// Dynamically import dashboard with no SSR to avoid Web3 hydration issues
const DashboardClient = dynamic(() => import('./dashboard-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading Dashboard...</p>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardClient />;
}
