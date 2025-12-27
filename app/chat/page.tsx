"use client";

import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues
const ChatPageClient = dynamic(
  () => import("./chat-page-client").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    ),
  }
);

export default function ChatPage() {
  return <ChatPageClient />;
}
