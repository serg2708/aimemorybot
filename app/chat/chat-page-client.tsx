/**
 * Chat page - Main chat interface
 * Styled to match home/dashboard pages
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { Footer } from "@/components/footer";
import { WalletConnect } from "@/components/wallet-connect";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamic import to prevent SSR issues
const SimpleChatInterface = dynamic(
  () => import("@/components/simple-chat-interface"),
  { ssr: false }
);

export default function ChatPageClient() {
  const [chatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by checking for session
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (session?.user) {
          // User is authenticated
          setIsAuthenticating(false);
        } else {
          // Redirect to guest login if not authenticated
          router.push(`/api/auth/guest?redirectUrl=${encodeURIComponent("/chat")}`);
        }
      } catch (error) {
        console.error("[ChatPage] Auth check failed:", error);
        // Try guest login on error
        router.push(`/api/auth/guest?redirectUrl=${encodeURIComponent("/chat")}`);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while authenticating
  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600 dark:text-gray-400">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <DataStreamProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                className="font-bold text-2xl transition-opacity hover:opacity-80"
                href="/"
              >
                AI Memory Box
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  className="font-medium text-sm hover:underline"
                  href="/pricing"
                >
                  Pricing
                </Link>
                <Link
                  className="font-medium text-sm hover:underline"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <SimpleChatInterface chatId={chatId} initialChatModel={chatModel} />
          </div>
        </div>

        <Footer />

        <DataStreamHandler />
      </div>
    </DataStreamProvider>
  );
}
