/**
 * Chat page - Main chat interface
 * Simplified structure based on working home page
 */

'use client';

import { useState } from 'react';
import { useAccount } from '@/hooks/use-web3-safe';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import Link from 'next/link';
import { WalletConnect } from '@/components/wallet-connect';

export default function ChatClient() {
  const { isConnected } = useAccount();
  const [chatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            AI Memory Box
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">
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
