import { Clapperboard, Film, Moon, Sun, Tv } from "lucide-react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { useTheme } from "@/contexts/theme-context";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`status-badge ${active ? "active" : "inactive"}`}>
      <span className="status-dot" />
      {label}
    </span>
  );
}

export default function App() {
  const { data: overview } = useLibraryOverview();
  const { messages, isSending, sendMessage } = useChat();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-stage">
      <div className="background-veil" aria-hidden />
      <div className="background-grid" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Clapperboard size={20} strokeWidth={2.25} />
          </div>
          <div className="brand-text">
            <p>Cartelera</p>
            <small>Chat de tu biblioteca Jellyfin</small>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="topbar-row">
            {overview && (
              <div className="library-stat">
                <span>
                  <Film size={12} />
                  <strong>{overview.stats.movies}</strong> peliculas
                </span>
                <span className="divider" aria-hidden />
                <span>
                  <Tv size={12} />
                  <strong>{overview.stats.series}</strong> series
                </span>
              </div>
            )}
            <button type="button" className="icon-button" onClick={toggleTheme} title="Cambiar tema">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <div className="topbar-row">
            <div className="status-group">
              <StatusBadge active={overview?.sync.isConnected ?? false} label="Jellyfin" />
              <StatusBadge active={overview?.capabilities.tmdbConfigured ?? false} label="TMDB" />
              <StatusBadge active={overview?.capabilities.assistantConfigured ?? false} label="IA" />
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <ChatPanel messages={messages} isSending={isSending} onSendMessage={sendMessage} />
      </main>
    </div>
  );
}
