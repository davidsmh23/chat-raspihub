import { lazy, Suspense } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaHighlightProvider } from "@/contexts/media-highlight-context";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";
import { useSaveMemory } from "@/hooks/useMemory";

const SplineScene = lazy(() =>
  import("@/components/SplineScene").then((m) => ({ default: m.SplineScene }))
);

export default function App() {
  const { data: overview } = useLibraryOverview();
  const { messages, isSending, sendMessage } = useChat();
  const { saveMemory, isSaving, lastSavedAt } = useSaveMemory();

  const hasConversation = messages.filter((m) => m.id !== "welcome").length > 0;

  const handleSaveSession = () => {
    void saveMemory(messages);
  };

  return (
    <MediaHighlightProvider>
      <div
        style={{
          minHeight: "100dvh",
          background: "#0a0a0f",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <AppHeader overview={overview} />

        {/* Hidden MediaGrid to populate library context — not rendered visually */}
        <div style={{ display: "none" }}>
          <MediaGrid overview={overview} />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <AppSidebar
            overview={overview}
            messages={messages}
            onSaveSession={handleSaveSession}
            isSaving={isSaving}
            lastSavedAt={lastSavedAt}
          />

          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                maxWidth: 800,
                width: "100%",
                margin: "0 auto",
                padding: "0 16px",
              }}
            >
              {!hasConversation && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: "32px 0 0",
                    flexShrink: 0,
                  }}
                >
                  <Suspense fallback={<div style={{ width: 400, height: 400 }} />}>
                    <SplineScene />
                  </Suspense>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
                      fontWeight: 300,
                      letterSpacing: "0.15em",
                      color: "rgba(201,168,76,0.5)",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    Tu asistente de biblioteca Jellyfin
                  </p>
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  minHeight: hasConversation ? 0 : "auto",
                  display: "flex",
                  flexDirection: "column",
                  paddingBottom: 24,
                  marginTop: hasConversation ? 0 : 24,
                }}
              >
                <ChatPanel
                  messages={messages}
                  isSending={isSending}
                  onSendMessage={sendMessage}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </MediaHighlightProvider>
  );
}
