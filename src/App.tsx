import { Bot, CheckCircle2, Server, Sparkles } from "lucide-react";

import { ChatTranscript } from "@/components/chat/chat-transcript";
import { OverviewSidebar } from "@/components/dashboard/overview-sidebar";
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
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-4 md:px-6 md:py-6 xl:px-8">
        <header className="rounded-[34px] border border-white/70 bg-[linear-gradient(135deg,rgba(31,30,29,0.96),rgba(61,58,52,0.92))] px-6 py-6 text-bg-0 shadow-[0_36px_120px_-56px_rgba(0,0,0,0.55)] md:px-8 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-[#f0b48e]" />
                RaspiHub AI
              </div>
              <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-white md:text-5xl">
                Biblioteca, asistente y despliegue en una base más limpia y seria.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                El frontend ahora está desacoplado del backend, el flujo conversa con una API
                real, el estado del servidor se refleja en la interfaz y la base queda lista
                para compilarse y desplegarse con Docker o Gunicorn detrás de un reverse proxy.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroStat
                icon={Bot}
                label="Asistente"
                value={overview?.capabilities.assistantConfigured ? "Listo" : "Pendiente"}
              />
              <HeroStat
                icon={Server}
                label="Jellyfin"
                value={overview?.sync.isConnected ? "Conectado" : "Sin enlace"}
              />
              <HeroStat icon={CheckCircle2} label="Build" value="Producción" />
            </div>
          </div>
        </header>

        <section className="mt-6 grid flex-1 gap-6 xl:grid-cols-[360px,1fr]">
          <OverviewSidebar
            overview={overview}
            isLoading={isLoading}
            error={error}
            onRefresh={() => void refresh()}
            onQuickPrompt={(prompt) => void handleQuickPrompt(prompt)}
            isSending={isSending}
          />

          <section className="flex min-h-[70vh] flex-col rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,249,245,0.9))] p-4 shadow-[0_30px_90px_-42px_rgba(44,38,30,0.28)] backdrop-blur md:p-5">
            <div className="flex flex-col gap-3 border-b border-bg-300/80 px-2 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-text-400">Conversación</p>
                <h2 className="mt-2 font-serif text-3xl text-text-100">Centro de control</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-300">
                  Usa el compositor para adjuntar documentos, pegar texto largo, alternar un
                  razonamiento más profundo y consultar el estado real de la biblioteca.
                </p>
              </div>
              {chatError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {chatError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-5 px-1 py-5">
              <ChatTranscript messages={messages} isSending={isSending} />
              <ClaudeChatInput onSendMessage={sendMessage} disabled={isSending} />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

interface HeroStatProps {
  icon: typeof Bot;
  label: string;
  value: string;
}

function HeroStat({ icon: Icon, label, value }: HeroStatProps) {
  return (
    <div className="rounded-[26px] border border-white/12 bg-white/7 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-2 text-white/60">
        <Icon className="h-4 w-4 text-[#f0b48e]" />
        <span className="text-xs uppercase tracking-[0.24em]">{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
