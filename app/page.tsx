import dynamic from 'next/dynamic';

// Force dynamic rendering to avoid SSG issues with Web3
export const dynamic = 'force-dynamic';

// Dynamic import to prevent SSR issues
const HomeClient = dynamic(() => import('./home-client').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <HomeClient />;
}
