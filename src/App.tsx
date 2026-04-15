import { Film, RefreshCcw, Sparkles, Tv2 } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";

export default function App() {
  const { data: overview, isLoading, error, refresh } = useLibraryOverview();
  const { messages, isSending, sendMessage } = useChat();

  return (
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f5f0e7_32%,#eee7dc_100%)] text-text-100">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden px-3 py-3 md:px-5 md:py-4">
        <header className="shrink-0 border-b border-black/8 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-text-400">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                RaspiHub AI
              </div>
              <h1 className="mt-2 font-serif text-[1.9rem] leading-tight tracking-tight text-text-100 md:text-[2.25rem]">
                Chat de biblioteca
              </h1>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-bg-300 bg-white/70 px-4 text-sm text-text-300 shadow-sm transition hover:border-accent hover:text-accent"
            >
              <RefreshCcw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              <span className="hidden sm:inline">{isLoading ? "Actualizando" : "Actualizar"}</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-300">
            <span className="inline-flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" />
              {overview?.stats.movies ?? 0} películas
            </span>
            <span className="inline-flex items-center gap-2">
              <Tv2 className="h-4 w-4 text-accent" />
              {overview?.stats.series ?? 0} series
            </span>
            <span>Jellyfin {overview?.sync.isConnected ? "conectado" : "sin enlace"}</span>
            <span>TMDB {overview?.capabilities.tmdbConfigured ? "activo" : "sin configurar"}</span>
          </div>

          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatTranscript messages={messages} isSending={isSending} />
          </div>

          <div className="shrink-0 border-t border-black/8 bg-[linear-gradient(180deg,rgba(238,231,220,0),rgba(238,231,220,0.72)_28%,rgba(238,231,220,0.96)_100%)] px-1 pb-2 pt-3 md:px-2 md:pb-3 md:pt-4">
            <div className="mx-auto w-full max-w-4xl">
              <ClaudeChatInput onSendMessage={sendMessage} disabled={isSending} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
