import { useEffect, useRef } from "react";
import gsap from "gsap";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { AuditSidebar } from "@/components/dashboard/overview-sidebar";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaHighlightProvider } from "@/contexts/media-highlight-context";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";

export default function App() {
  const { data: overview, isLoading, refresh } = useLibraryOverview();
  const { messages, isSending, sendMessage } = useChat();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    gsap.from(rootRef.current, { opacity: 0, duration: 0.4, ease: "power2.out" });
  }, []);

  return (
    <MediaHighlightProvider>
      <div
        ref={rootRef}
        style={{
          minHeight: "100dvh",
          background: "#0a0a0f",
          overflowX: "hidden",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        className="custom-scrollbar"
      >
        <CinematicHero overview={overview} isLoading={isLoading} onRefresh={() => void refresh()} />

        <div
          style={{
            flex: 1,
            padding: "0 clamp(16px, 4vw, 48px)",
          }}
        >
          <MediaGrid overview={overview} />

          <div
            style={{
              display: "flex",
              gap: 8,
              paddingBottom: 48,
              height: "clamp(480px, 55vh, 640px)",
            }}
          >
            <AuditSidebar overview={overview} />

            <ChatPanel
              messages={messages}
              isSending={isSending}
              onSendMessage={sendMessage}
            />
          </div>
        </div>
      </div>
    </MediaHighlightProvider>
  );
}
