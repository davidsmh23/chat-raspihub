import { useEffect, useRef } from "react";

import { ChatMessage } from "@/components/chat/chat-message";
import type { ChatUiMessage } from "@/types/api";

interface ChatTranscriptProps {
  messages: ChatUiMessage[];
  isSending: boolean;
}

export function ChatTranscript({ messages, isSending }: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  return (
    <div className="custom-scrollbar flex min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isSending ? (
        <div className="flex max-w-[160px] items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-3 text-sm text-text-400 shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
          Generando respuesta...
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
