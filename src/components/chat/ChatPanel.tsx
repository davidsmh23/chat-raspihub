import {
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUp, Clapperboard, Film, Sparkles, Tv2 } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import type { ChatRequestPayload, ChatUiMessage, PastedContentPayload } from "@/types/api";

interface ChatPanelProps {
  messages: ChatUiMessage[];
  isSending: boolean;
  onSendMessage: (payload: ChatRequestPayload) => Promise<void> | void;
}

const QUICK_PROMPTS = [
  { text: "Recomiendame una pelicula para hoy", icon: Film },
  { text: "Series cortas para empezar esta semana", icon: Tv2 },
  { text: "Top peliculas mejor valoradas en mi biblioteca", icon: Clapperboard },
  { text: "Algo parecido a sci-fi con buen ritmo", icon: Sparkles },
];

export function ChatPanel({ messages, isSending, onSendMessage }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [pastedContent, setPastedContent] = useState<PastedContentPayload[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [message]);

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text.length <= 300) return;
    e.preventDefault();
    const block: PastedContentPayload = {
      id: crypto.randomUUID(),
      content: text.slice(0, 4000),
      timestamp: new Date().toISOString(),
    };
    setPastedContent((current) => [...current, block]);
    if (!message.trim()) setMessage("Usa el texto pegado como contexto para recomendar.");
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
    if ((!payload.message && !payload.pastedContent.length) || isSending) return;
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

  const canSend = !!message.trim() || pastedContent.length > 0;

  return (
    <section className="chat-shell">
      <header className="chat-header">
        <div>
          <p className="eyebrow">Asistente de streaming</p>
          <h2>Descubre tu proxima pelicula o serie</h2>
        </div>
      </header>

      <ChatTranscript messages={messages} isSending={isSending} />

      <footer className="chat-composer-wrap">
        <div className="quick-prompt-row">
          {QUICK_PROMPTS.map(({ text, icon: Icon }) => (
            <button
              key={text}
              type="button"
              disabled={isSending}
              onClick={() => {
                setMessage(text);
                textareaRef.current?.focus();
              }}
            >
              <Icon size={13} />
              {text}
            </button>
          ))}
        </div>

        {pastedContent.length > 0 && (
          <div className="pasted-context-chip">
            Contexto adjunto: {pastedContent.length} bloque{pastedContent.length > 1 ? "s" : ""}
          </div>
        )}

        <div className={`chat-composer ${inputFocused ? "focused" : ""}`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={isSending}
            placeholder="Pide recomendaciones por genero, estado de animo, duracion o disponibilidad..."
            className="custom-scrollbar"
          />
          <button
            type="button"
            disabled={!canSend || isSending}
            className="send-button"
            onClick={() => void handleSend()}
            aria-label="Enviar mensaje"
          >
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="composer-hint">Enter para enviar - Shift + Enter para nueva linea</p>
      </footer>
    </section>
  );
}
