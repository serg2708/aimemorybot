/**
 * Simple Chat Interface
 * Simplified chat component without complex header/sidebar
 */

"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers } from "@/lib/utils";
import { Artifact } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";

export default function SimpleChatInterface({
  chatId,
  initialChatModel,
}: {
  chatId: string;
  initialChatModel: string;
}) {
  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(undefined);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  const visibilityType = "private";
  const visibilityTypeRef = useRef(visibilityType);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Create transport with dynamic import to avoid SSR issues
  const [transport, setTransport] = useState<any>(null);
  const [transportError, setTransportError] = useState<Error | null>(null);

  useEffect(() => {
    import("ai").then((module) => {
      try {
        const transportInstance = new module.DefaultChatTransport({
          api: "/api/chat",
          fetch: fetchWithErrorHandlers,
          prepareSendMessagesRequest(request) {
            return {
              body: {
                id: request.id,
                message: request.messages.at(-1),
                selectedChatModel: currentModelIdRef.current,
                selectedVisibilityType: visibilityTypeRef.current,
                ...request.body,
              },
            };
          },
        });
        setTransport(transportInstance);
      } catch (error) {
        console.error("[SimpleChatInterface] Transport initialization error:", error);
        setTransportError(error as Error);
      }
    });
  }, []);

  const {
    messages,
    setMessages,
    handleSubmit,
    reload,
    stop,
    isLoading,
    append,
    data: streamData,
  } = useChat({
    id: chatId,
    body: { id: chatId },
    initialMessages: [],
    experimental_throttle: 100,
    transport: transport || undefined,
    onResponse(response) {
      if (response.status === 401) {
        window.location.href = "/api/auth/guest";
      }
    },
    onFinish(message) {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError(error) {
      if (error instanceof ChatSDKError) {
        console.error("[SimpleChatInterface] Chat SDK error:", error);
        if (error.code === "PAYMENT_REQUIRED") {
          setShowCreditCardAlert(true);
          return;
        }

        toast({
          title: "Error",
          description: error.message,
        });
      } else {
        console.error("[SimpleChatInterface] Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
      }
    },
  });

  useEffect(() => {
    if (streamData) {
      setDataStream(streamData);
    }
  }, [streamData, setDataStream]);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${chatId}`,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
      {/* Simple Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">
              AI Chat
            </h1>
            <p className="text-gray-600 text-sm dark:text-gray-400">
              Start a conversation with AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-gray-700 text-sm font-medium dark:text-gray-300">
              Model:
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400"
              onChange={(e) => setCurrentModelId(e.target.value)}
              value={currentModelId}
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="grok-2-1212">Grok 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-lg text-gray-900 dark:text-white">
                Start a conversation
              </h3>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Type your message below to begin chatting with AI
              </p>
            </div>
          </div>
        ) : (
          <Messages
            chatId={chatId}
            isLoading={isLoading}
            messages={messages}
            reload={reload}
            setMessages={setMessages}
            votes={votes}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <form className="relative" onSubmit={handleSubmit}>
          <MultimodalInput
            append={append}
            attachments={attachments}
            handleSubmit={handleSubmit}
            input={input}
            isLoading={isLoading}
            messages={messages}
            setAttachments={setAttachments}
            setInput={setInput}
            stop={stop}
          />
        </form>
      </div>

      {/* Artifact Sidebar */}
      <Artifact chatId={chatId} />
    </div>
  );
}
