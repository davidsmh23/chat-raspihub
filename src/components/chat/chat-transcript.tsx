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
    <div className="chat-transcript custom-scrollbar">
      <div className="chat-transcript-inner">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isSending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="message-label">Asistente</div>
      <div className="typing-indicator">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
