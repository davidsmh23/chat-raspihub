import { Moon, Save, Sun } from "lucide-react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { useTheme } from "@/contexts/theme-context";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";
import { useSaveMemory } from "@/hooks/useMemory";

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
  const { saveMemory, isSaving } = useSaveMemory();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-stage">
      <div className="background-veil" aria-hidden />
      <div className="background-grid" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <p>RaspiHub Chat</p>
            <small>Recomendador de peliculas y series</small>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="status-group">
            <StatusBadge active={overview?.sync.isConnected ?? false} label="Jellyfin" />
            <StatusBadge active={overview?.capabilities.tmdbConfigured ?? false} label="TMDB" />
            <StatusBadge active={overview?.capabilities.assistantConfigured ?? false} label="IA" />
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() => void saveMemory(messages)}
            disabled={isSaving}
            title="Guardar resumen de sesion"
          >
            <Save size={14} />
            {isSaving ? "Guardando" : "Guardar"}
          </button>

          <button type="button" className="icon-button" onClick={toggleTheme} title="Cambiar tema">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className="app-main">
        <ChatPanel messages={messages} isSending={isSending} onSendMessage={sendMessage} />
      </main>
    </div>
  );
}
