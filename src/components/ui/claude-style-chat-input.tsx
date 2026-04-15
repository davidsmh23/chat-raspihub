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
    <div className="mx-auto w-full max-w-4xl">
      <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,242,234,0.94))] p-3 shadow-[0_30px_80px_-44px_rgba(44,38,30,0.34)] backdrop-blur md:rounded-[40px] md:p-4">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(217,119,87,0.34),transparent)]" />

        {pastedPreview ? (
          <div className="mb-3 rounded-[24px] border border-[#eadfd3] bg-[#f8f3ec] px-4 py-3 text-sm text-text-300">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-text-400">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Contexto pegado
            </div>
            <p className="mt-2 max-h-12 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-text-300">
              {pastedPreview}
            </p>
          </div>
        ) : null}

        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje sobre la biblioteca o el servidor..."
            className="custom-scrollbar min-h-[88px] flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-[15px] leading-7 text-text-100 outline-none placeholder:text-text-400 md:min-h-[96px]"
            disabled={disabled}
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!hasComposerContent || disabled}
            className={cn(
              "mb-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition",
              hasComposerContent && !disabled
                ? "bg-[linear-gradient(135deg,#d97757_0%,#c6613f_100%)] text-white shadow-[0_18px_36px_-18px_rgba(198,97,63,0.9)] hover:scale-[1.01] hover:shadow-[0_22px_42px_-18px_rgba(198,97,63,0.95)]"
                : "bg-[#e8ddd2] text-white/70",
            )}
            aria-label="Enviar mensaje"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-text-500">
        Revisa siempre la información crítica antes de tomar decisiones.
      </p>
    </div>
  );
}
