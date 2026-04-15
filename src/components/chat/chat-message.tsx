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
        "max-w-[92%] px-0 py-3 text-sm leading-7 transition-colors md:max-w-[80%]",
        isAssistant
          ? "text-text-200"
          : "ml-auto max-w-[88%] rounded-[22px] bg-[linear-gradient(135deg,#1f1e1d_0%,#35312b_100%)] px-4 py-3 text-bg-0 md:px-5",
      )}
    >
      {message.meta && (
        <div className="mb-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em]">
          {message.meta.model ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                isAssistant ? "bg-bg-200 text-text-400" : "bg-white/10 text-white/60",
              )}
            >
              {message.meta.model}
            </span>
          ) : null}
          {!!message.meta.files && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                isAssistant ? "bg-bg-200 text-text-400" : "bg-white/10 text-white/60",
              )}
            >
              {message.meta.files} archivo{message.meta.files > 1 ? "s" : ""}
            </span>
          )}
          {!!message.meta.pasted && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                isAssistant ? "bg-bg-200 text-text-400" : "bg-white/10 text-white/60",
              )}
            >
              {message.meta.pasted} pegado{message.meta.pasted > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {isAssistant ? (
        <div className="space-y-3 text-[15px] leading-7 [&_a]:text-accent [&_code]:rounded [&_code]:bg-bg-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:my-0 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#1f1e1d] [&_pre]:p-4 [&_pre]:text-[#f7f5ee] [&_ul]:space-y-2 [&_ul]:pl-5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{message.content}</p>
      )}
    </article>
  );
}
