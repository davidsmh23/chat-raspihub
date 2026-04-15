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
    <div className="custom-scrollbar h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-7 px-2 py-5 md:px-4 md:py-7">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isSending ? (
          <div className="flex max-w-[190px] items-center gap-2 rounded-full border border-[#d8e4f3] bg-[#edf4fb] px-4 py-3 text-sm text-text-400">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            Generando respuesta...
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
