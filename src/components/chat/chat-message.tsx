import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { RecommendationGrid } from "@/components/chat/MovieCard";
import type { ChatUiMessage } from "@/types/api";

interface ChatMessageProps {
  message: ChatUiMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  if (isAssistant) {
    return (
      <article className="message-row assistant">
        <div className="message-label">Asistente</div>
        <div className="message-bubble assistant">
          <div className="message-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        </div>
        <RecommendationGrid items={message.recommendations ?? []} />
      </article>
    );
  }

  return (
    <article className="message-row user">
      <div className="message-label">Tu</div>
      <div className="message-bubble user">
        <p>{message.content}</p>
      </div>
    </article>
  );
}
