/**
 * Chat page - Main chat interface
 * Styled to match home/dashboard pages
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { WalletConnect } from "@/components/wallet-connect";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues
const SimpleChatInterface = dynamic(
  () => import("@/components/simple-chat-interface"),
  { ssr: false }
);

export default function ChatPageClient() {
  const [chatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());

  return (
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

      <DataStreamHandler />
    </div>
  );
}
