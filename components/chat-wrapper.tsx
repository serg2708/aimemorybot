/**
 * Chat wrapper with dynamic import
 * Prevents SSR/hydration issues by loading Chat component only on client
 */

'use client';

import dynamic from 'next/dynamic';
import type { ChatMessage } from '@/lib/types';
import type { AppUsage } from '@/lib/usage';
import type { VisibilityType } from './visibility-selector';

const Chat = dynamic(() => import('./chat').then(mod => ({ default: mod.Chat })), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh min-w-0 flex-col bg-background items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading chat...</p>
      </div>
    </div>
  ),
});

interface ChatWrapperProps {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}

export function ChatWrapper(props: ChatWrapperProps) {
  return <Chat {...props} />;
}
