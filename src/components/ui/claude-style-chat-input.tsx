import type { ClipboardEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatRequestPayload, PastedContentPayload } from "@/types/api";

interface ClaudeChatInputProps {
  onSendMessage: (data: ChatRequestPayload) => Promise<void> | void;
  disabled?: boolean;
}

export default function ClaudeChatInput({
  onSendMessage,
  disabled = false,
}: ClaudeChatInputProps) {
  const [message, setMessage] = useState("");
  const [pastedContent, setPastedContent] = useState<PastedContentPayload[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
  }, [message]);

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData("text");
    if (text.length > 320) {
      event.preventDefault();
      const block: PastedContentPayload = {
        id: crypto.randomUUID(),
        content: text.slice(0, 4000),
        timestamp: new Date().toISOString(),
      };
      setPastedContent((current) => [...current, block]);
      if (!message.trim()) {
        setMessage("Usa el texto pegado como contexto.");
      }
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
    const hasContent = payload.message || payload.pastedContent.length > 0;

    if (!hasContent || disabled) {
      return;
    }

    await onSendMessage(payload);
    setMessage("");
    setPastedContent([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = async (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const hasComposerContent = !!message.trim() || pastedContent.length > 0;
  const pastedPreview = pastedContent[pastedContent.length - 1]?.content;

  return (
    <div className="w-full">
      <div className="relative">
        {pastedPreview ? (
          <div className="mb-3 rounded-[22px] border border-[#eadfd3] bg-[#f8f3ec]/90 px-4 py-3 text-sm text-text-300">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-text-400">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Contexto pegado
            </div>
            <p className="mt-2 max-h-12 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-text-300">
              {pastedPreview}
            </p>
          </div>
        ) : null}

        <div className="px-1 py-1">
          <div className="relative rounded-[26px] border border-[#ebe2d7] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f2ea_100%)] px-4 py-3 shadow-[0_18px_40px_-34px_rgba(44,38,30,0.22)]">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje sobre la biblioteca o el servidor..."
              className="custom-scrollbar min-h-[88px] w-full resize-none overflow-y-auto bg-transparent px-0 py-0 pr-16 text-[15px] leading-7 text-text-100 outline-none placeholder:text-text-400 md:min-h-[96px]"
              disabled={disabled}
            />

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!hasComposerContent || disabled}
              className={cn(
                "absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full transition",
                hasComposerContent && !disabled
                  ? "bg-[linear-gradient(135deg,#d97757_0%,#c6613f_100%)] text-white shadow-[0_18px_36px_-18px_rgba(198,97,63,0.9)] hover:scale-[1.01] hover:shadow-[0_22px_42px_-18px_rgba(198,97,63,0.95)]"
                  : "bg-[#eadfd4] text-white/75",
              )}
              aria-label="Enviar mensaje"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-text-500">
        Revisa siempre la información crítica antes de tomar decisiones.
      </p>
    </div>
  );
}
