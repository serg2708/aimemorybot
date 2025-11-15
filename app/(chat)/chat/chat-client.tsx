'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';

export default function ChatClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chatModel, setChatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());

  useEffect(() => {
    // Redirect to guest auth if not authenticated
    if (status === 'unauthenticated') {
      router.push('/api/auth/guest');
      return;
    }

    // Get chat model from cookie
    if (typeof window !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('chat-model='))
        ?.split('=')[1];

      if (cookieValue) {
        setChatModel(cookieValue);
      }
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
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
    </>
  );
}
