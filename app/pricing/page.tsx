import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues
// ssr: false already prevents static generation
const PricingClient = dynamic(() => import('./pricing-client').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading pricing...</p>
      </div>
    </div>
  ),
});

export default function PricingPage() {
  return <PricingClient />;
}
