'use client';

import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with Web3 and chat functionality
const ChatClient = dynamic(() => import('./chat-client').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading chat...</p>
      </div>
    </div>
  ),
});

export default function ChatPage() {
  return <ChatClient />;
}
