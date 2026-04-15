import { Film, MessageSquareQuote, Server, Sparkles, Tv2 } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { useChat } from "@/hooks/use-chat";
import { useLibraryOverview } from "@/hooks/use-library-overview";
import type { ChatRequestPayload } from "@/types/api";

export default function App() {
  const { data: overview, isLoading, error, refresh } = useLibraryOverview();
  const { messages, isSending, sendMessage } = useChat();

  const floatingPrompts = [
    "¿Qué series parecen estar desactualizadas según TMDB?",
    "Resume el estado actual del servidor y de la biblioteca.",
    "¿Qué géneros de películas tengo más repetidos?",
    "Dime películas de ciencia ficción o acción que tenga en la biblioteca.",
    "¿Hay series con pocas temporadas locales respecto a TMDB?",
  ];

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
    <main className="h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,#f8f3ea_0%,#f4efe5_38%,#ece7db_100%)] text-text-100">
      <aside className="pointer-events-none fixed right-6 top-1/2 z-20 hidden w-[290px] -translate-y-1/2 2xl:block">
        <div className="pointer-events-auto overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,239,229,0.92))] shadow-[0_28px_70px_-40px_rgba(44,38,30,0.32)] backdrop-blur">
          <div className="border-b border-black/8 px-4 py-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-text-400">
              <MessageSquareQuote className="h-4 w-4 text-accent" />
              Prompts
            </div>
            <p className="mt-2 text-sm leading-6 text-text-300">
              Acciones rápidas para consultar la biblioteca sin escribir desde cero.
            </p>
          </div>

          <div className="divide-y divide-black/6">
            {floatingPrompts.map((prompt, index) => (
              <button
                key={prompt}
                type="button"
                disabled={isSending}
                onClick={() => void handleQuickPrompt(prompt)}
                className="grid w-full grid-cols-[32px,1fr] gap-3 px-4 py-3 text-left transition hover:bg-white/55 disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2e9de] text-xs font-semibold text-accent">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-text-200">{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden px-4 py-3 md:px-6 md:py-4">
        <header className="shrink-0 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-text-400">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                RaspiHub AI
              </div>
              <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight text-text-100 md:text-5xl">
                Conversación clara, bloque único.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-300">
                Biblioteca, estado del servidor y chat en una misma estructura visual, más
                contenida y más sólida.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-bg-300 bg-white/65 px-4 text-sm text-text-300 shadow-sm transition hover:border-accent hover:text-accent"
            >
              <Server className="h-4 w-4" />
              {isLoading ? "Actualizando..." : "Actualizar"}
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

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </header>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-hidden px-3 py-2 md:px-5 md:py-3">
              <ChatTranscript messages={messages} isSending={isSending} />
            </div>

            <div className="shrink-0 px-3 pb-2 pt-1 md:px-5 md:pb-3 md:pt-1">
              <div className="w-full">
                <ClaudeChatInput onSendMessage={sendMessage} disabled={isSending} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
