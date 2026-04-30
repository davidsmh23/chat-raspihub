import { useEffect, useRef } from "react";
import gsap from "gsap";

import { ChatMessage } from "@/components/chat/chat-message";
import type { ChatUiMessage } from "@/types/api";

interface ChatTranscriptProps {
  messages: ChatUiMessage[];
  isSending: boolean;
}

export function ChatTranscript({ messages, isSending }: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

    if (messages.length > prevLenRef.current) {
      const container = bottomRef.current?.parentElement;
      const newMessages = container?.querySelectorAll("article");
      if (newMessages?.length) {
        const last = newMessages[newMessages.length - 1];
        gsap.from(last, { y: 20, opacity: 0, duration: 0.35, ease: "power2.out" });
      }
    }
    prevLenRef.current = messages.length;
  }, [messages, isSending]);

  return (
    <div
      className="custom-scrollbar"
      style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "20px 20px 8px",
          minHeight: "100%",
        }}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isSending && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 99,
              border: "1px solid rgba(201,168,76,0.2)",
              background: "rgba(201,168,76,0.05)",
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#c9a84c",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                color: "#9a9080",
                letterSpacing: "0.08em",
              }}
            >
              Generando respuesta...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
