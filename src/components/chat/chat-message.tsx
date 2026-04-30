import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MovieCardGrid } from "@/components/chat/MovieCard";
import { useMediaHighlight } from "@/contexts/media-highlight-context";
import type { ChatUiMessage, LibraryItem } from "@/types/api";

interface ChatMessageProps {
  message: ChatUiMessage;
}

function extractMatchedItems(content: string, libraryItems: LibraryItem[], libraryTitles: string[]): LibraryItem[] {
  if (!content.includes("\n- ") && !content.startsWith("- ")) return [];

  const sortedTitles = [...libraryTitles].sort((a, b) => b.length - a.length);
  const matched: LibraryItem[] = [];
  const seen = new Set<string>();

  for (const title of sortedTitles) {
    const lower = title.toLowerCase();
    if (content.toLowerCase().includes(lower) && !seen.has(lower)) {
      const item = libraryItems.find((i) => i.name.toLowerCase() === lower);
      if (item) {
        matched.push(item);
        seen.add(lower);
      }
    }
    if (matched.length >= 8) break;
  }

  return matched;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const { libraryTitles, libraryItems, highlight } = useMediaHighlight();

  const matchedItems = isAssistant
    ? extractMatchedItems(message.content, libraryItems, libraryTitles)
    : [];

  const TitleSpan = ({ children }: { children: React.ReactNode }) => {
    const textContent = typeof children === "string" ? children : "";
    if (!textContent || !libraryTitles.length || !isAssistant) {
      return <span>{children}</span>;
    }

    const sortedTitles = [...libraryTitles].sort((a, b) => b.length - a.length);
    const escaped = sortedTitles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = textContent.split(pattern);

    return (
      <>
        {parts.map((part, i) => {
          const matched = sortedTitles.find((t) => t.toLowerCase() === part.toLowerCase());
          if (matched) {
            return (
              <button
                key={i}
                onClick={() => highlight(matched)}
                style={{
                  color: "#c9a84c",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: "rgba(201,168,76,0.5)",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                  fontWeight: 500,
                  display: "inline",
                }}
                title={`Resaltar "${matched}" en la biblioteca`}
              >
                {part}
              </button>
            );
          }
          return part;
        })}
      </>
    );
  };

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: isAssistant ? "flex-start" : "flex-end",
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: "#9a9080",
          fontFamily: "var(--font-ui)",
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        {isAssistant ? "Asistente" : "Tú"}
      </div>

      <div
        style={{
          maxWidth: "92%",
          ...(isAssistant
            ? {}
            : {
                background: "linear-gradient(135deg, #1e1a0e 0%, #16120a 100%)",
                border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: 16,
                padding: "12px 16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }),
        }}
      >
        {!!message.meta?.pasted && (
          <div
            style={{
              marginBottom: 10,
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontFamily: "var(--font-ui)",
            }}
          >
            <span
              style={{
                background: "rgba(201,168,76,0.1)",
                color: "#c9a84c",
                borderRadius: 99,
                padding: "2px 8px",
              }}
            >
              {message.meta.pasted} pegado{message.meta.pasted > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isAssistant ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                lineHeight: 1.75,
                color: "#f5f0e8",
              }}
              className="
                [&_p]:my-0
                [&_a]:text-[#c9a84c]
                [&_code]:rounded [&_code]:bg-[rgba(201,168,76,0.1)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#c9a84c] [&_code]:font-mono [&_code]:text-[0.85em]
                [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#0d0d1a] [&_pre]:p-4 [&_pre]:border [&_pre]:border-[rgba(201,168,76,0.1)]
                [&_ul]:pl-5 [&_ul]:space-y-1.5
                [&_ol]:pl-5 [&_ol]:space-y-1.5
                [&_li]:list-disc
                [&_strong]:text-[#e8c96a] [&_strong]:font-medium
                [&_table]:border-collapse [&_table]:w-full
                [&_th]:border [&_th]:border-[rgba(201,168,76,0.2)] [&_th]:p-2 [&_th]:text-left [&_th]:text-[#c9a84c] [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider
                [&_td]:border [&_td]:border-[rgba(201,168,76,0.1)] [&_td]:p-2 [&_td]:text-sm
                space-y-3
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p>
                      {typeof children === "string" ? (
                        <TitleSpan>{children}</TitleSpan>
                      ) : (
                        children
                      )}
                    </p>
                  ),
                  li: ({ children }) => (
                    <li>
                      {typeof children === "string" ? (
                        <TitleSpan>{children}</TitleSpan>
                      ) : (
                        children
                      )}
                    </li>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {matchedItems.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <MovieCardGrid items={matchedItems} />
              </div>
            )}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              color: "#e8d9b8",
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
          </p>
        )}
      </div>
    </article>
  );
}
