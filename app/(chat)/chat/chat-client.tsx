/**
 * Chat page - Main chat interface
 * Simplified structure based on working home page
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { WalletConnect } from "@/components/wallet-connect";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

export default function ChatClient() {
  const [chatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
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

      {/* Chat Interface */}
      <div className="container mx-auto px-4">
        <Chat
          autoResume={false}
          id={chatId}
          initialChatModel={chatModel}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={chatId}
        />
        <DataStreamHandler />
      </div>
    </div>
  );
}
