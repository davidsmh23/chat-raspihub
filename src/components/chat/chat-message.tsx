import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import type { ChatUiMessage } from "@/types/api";

interface ChatMessageProps {
  message: ChatUiMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={cn(
        "flex w-full flex-col gap-2",
        isAssistant ? "items-start" : "items-end",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-1 text-[11px] uppercase tracking-[0.22em]",
          isAssistant ? "text-text-400" : "text-text-500",
        )}
      >
        <span>{isAssistant ? "Asistente" : "Tú"}</span>
      </div>

      <div
        className={cn(
          "max-w-[96%] px-1 py-0 text-sm leading-7 md:max-w-[92%]",
          isAssistant
            ? "text-text-200"
            : "rounded-[24px] border border-[#c9dbee] bg-[linear-gradient(180deg,#eef6ff_0%,#dfeefe_100%)] px-4 py-4 text-[#1f3c5b] shadow-[0_20px_40px_-32px_rgba(106,149,196,0.7)] md:px-5",
        )}
      >
        {!!message.meta?.pasted && (
          <div className="mb-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                isAssistant ? "bg-[#f1e8dc] text-text-400" : "bg-white/55 text-[#5b7ea4]",
              )}
            >
              {message.meta.pasted} pegado{message.meta.pasted > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isAssistant ? (
          <div className="space-y-3 text-[15px] leading-7 [&_a]:text-accent [&_code]:rounded [&_code]:bg-[#f1e8dc] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:my-0 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#1f1e1d] [&_pre]:p-4 [&_pre]:text-[#f7f5ee] [&_ul]:space-y-2 [&_ul]:pl-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p>
        )}
      </div>
    </article>
  );
}
