import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowUp, Sparkles } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import type { ChatUiMessage, ChatRequestPayload, PastedContentPayload } from "@/types/api";
import { useState, type ClipboardEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

interface ChatPanelProps {
  messages: ChatUiMessage[];
  isSending: boolean;
  onSendMessage: (payload: ChatRequestPayload) => Promise<void> | void;
}

const QUICK_PROMPTS = [
  "¿Qué series me recomiendas?",
  "Series con temporadas faltantes",
  "Top películas",
];

export function ChatPanel({ messages, isSending, onSendMessage }: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [pastedContent, setPastedContent] = useState<PastedContentPayload[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.from(panelRef.current, {
      y: 60,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      delay: 1.8,
    });
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
  }, [message]);

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.length > 320) {
      e.preventDefault();
      const block: PastedContentPayload = {
        id: crypto.randomUUID(),
        content: text.slice(0, 4000),
        timestamp: new Date().toISOString(),
      };
      setPastedContent((c) => [...c, block]);
      if (!message.trim()) setMessage("Usa el texto pegado como contexto.");
    }
  };

  const buildPayload = (): ChatRequestPayload => ({
    message: message.trim(),
    files: [],
    pastedContent,
    model: "gemini-2.5-flash",
    isThinkingEnabled: false,
  });

  const handleSend = async () => {
    const payload = buildPayload();
    if (!payload.message && !payload.pastedContent.length) return;
    if (isSending) return;
    await onSendMessage(payload);
    setMessage("");
    setPastedContent([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = async (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  };

  const hasContent = !!message.trim() || pastedContent.length > 0;

  return (
    <div
      ref={panelRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        height: "100%",
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 12,
        border: "1px solid rgba(201,168,76,0.15)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.5) 40%, rgba(201,168,76,0.8) 60%, transparent 100%)",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <ChatTranscript messages={messages} isSending={isSending} />
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: "8px 16px 16px",
          background: "linear-gradient(to top, rgba(10,10,15,1) 70%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              disabled={isSending}
              onClick={() => {
                setMessage(p);
                textareaRef.current?.focus();
              }}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                color: "#9a9080",
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.18)",
                borderRadius: 99,
                padding: "4px 10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.color = "#c9a84c";
                btn.style.borderColor = "rgba(201,168,76,0.4)";
                btn.style.background = "rgba(201,168,76,0.1)";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.color = "#9a9080";
                btn.style.borderColor = "rgba(201,168,76,0.18)";
                btn.style.background = "rgba(201,168,76,0.06)";
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {pastedContent.length > 0 && (
          <div
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#c9a84c",
                fontFamily: "var(--font-ui)",
                marginBottom: 4,
              }}
            >
              <Sparkles size={10} />
              Contexto pegado
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "#9a9080",
                maxHeight: 40,
                overflow: "hidden",
                lineHeight: 1.5,
              }}
            >
              {pastedContent[pastedContent.length - 1].content}
            </p>
          </div>
        )}

        <div
          style={{
            position: "relative",
            borderRadius: 10,
            background: "rgba(26,26,46,0.8)",
            border: "1px solid rgba(201,168,76,0.2)",
            padding: "10px 48px 10px 14px",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.45)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
          }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tu biblioteca..."
            disabled={isSending}
            className="custom-scrollbar"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "#f5f0e8",
              lineHeight: 1.6,
              minHeight: 56,
              maxHeight: 200,
              overflowY: "auto",
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!hasContent || isSending}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              cursor: hasContent && !isSending ? "pointer" : "default",
              background: hasContent && !isSending
                ? "linear-gradient(135deg, #c9a84c 0%, #7a6128 100%)"
                : "rgba(154,144,128,0.2)",
              color: hasContent && !isSending ? "#0a0a0f" : "#9a9080",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => {
              if (hasContent && !isSending)
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
            aria-label="Enviar mensaje"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
