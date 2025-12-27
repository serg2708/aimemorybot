/**
 * Chat page - Main chat interface
 * Uses the same structure as chat/[id]/page.tsx
 */

"use client";

import { useState } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

export default function ChatClient() {
  const [chatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId] = useState(() => generateUUID());

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
