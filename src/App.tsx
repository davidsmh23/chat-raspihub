import { Film, Server, Sparkles, Tv2 } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";
import type { ChatRequestPayload } from "@/types/api";

export default function App() {
  const { data: overview, isLoading, error, refresh } = useLibraryOverview();
  const { messages, isSending, error: chatError, sendMessage } = useChat();

  const handleQuickPrompt = async (prompt: string) => {
    const payload: ChatRequestPayload = {
      message: prompt,
      files: [],
      pastedContent: [],
      model: "gemini-2.5-flash",
      isThinkingEnabled: false,
    };
    await sendMessage(payload);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f4efe5_38%,#ece7db_100%)] text-text-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 md:px-6 md:py-7">
        <header className="border-b border-black/8 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-text-400">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                RaspiHub AI
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-text-100 md:text-5xl">
                Chat principal, contexto justo.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-text-300">
                Consulta la biblioteca, revisa series pendientes y habla con el asistente sin
                distracciones visuales.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-bg-300 px-4 text-sm text-text-300 transition hover:border-accent hover:text-accent"
            >
              <Server className="h-4 w-4" />
              {isLoading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-300">
            <span className="inline-flex items-center gap-2">
              <Film className="h-4 w-4 text-accent" />
              {overview?.stats.movies ?? 0} películas
            </span>
            <span className="inline-flex items-center gap-2">
              <Tv2 className="h-4 w-4 text-accent" />
              {overview?.stats.series ?? 0} series
            </span>
            <span>
              Jellyfin {overview?.sync.isConnected ? "conectado" : "sin enlace"}
            </span>
            <span>
              TMDB {overview?.capabilities.tmdbConfigured ? "activo" : "sin configurar"}
            </span>
          </div>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </header>

        <section className="flex flex-1 flex-col pt-5">
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              disabled={isSending}
              onClick={() => void handleQuickPrompt("¿Qué series parecen estar desactualizadas según TMDB?")}
              className="rounded-full border border-bg-300 px-3 py-1.5 text-text-300 transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              Series pendientes
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() => void handleQuickPrompt("Resume el estado actual del servidor y de la biblioteca.")}
              className="rounded-full border border-bg-300 px-3 py-1.5 text-text-300 transition hover:border-accent hover:text-accent disabled:opacity-50"
            >
              Estado del servidor
            </button>
          </div>

          {chatError ? <p className="mb-3 text-sm text-red-700">{chatError}</p> : null}

          <div className="flex flex-1 flex-col gap-5">
            <ChatTranscript messages={messages} isSending={isSending} />
            <ClaudeChatInput onSendMessage={sendMessage} disabled={isSending} />
          </div>
        </section>
      </div>
    </main>
  );
}
