import { AlertCircle, Bot, Database, Film, RefreshCcw, Sparkles, Tv } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LibraryOverviewPayload } from "@/types/api";

interface OverviewSidebarProps {
  overview: LibraryOverviewPayload | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onQuickPrompt: (prompt: string) => void;
  isSending: boolean;
}

const formatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function OverviewSidebar({
  overview,
  isLoading,
  error,
  onRefresh,
  onQuickPrompt,
  isSending,
}: OverviewSidebarProps) {
  const quickPrompts = [
    "¿Qué series parecen estar desactualizadas según TMDB?",
    "Resume el estado actual del servidor y de la biblioteca.",
    "Dime qué capacidad falta configurar para sacar más partido a la app.",
  ];

  return (
    <aside className="grid gap-4 xl:sticky xl:top-6 xl:h-fit">
      <section className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_-32px_rgba(44,38,30,0.28)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-text-400">Estado</p>
            <h2 className="mt-2 font-serif text-2xl text-text-100">Servidor y biblioteca</h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-bg-300 bg-bg-0 text-text-300 transition hover:border-accent hover:text-accent"
            aria-label="Refrescar datos"
          >
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard icon={Film} label="Películas" value={overview?.stats.movies ?? 0} />
          <MetricCard icon={Tv} label="Series" value={overview?.stats.series ?? 0} />
          <MetricCard icon={Database} label="Total" value={overview?.stats.totalItems ?? 0} />
        </div>

        <div className="mt-4 rounded-[28px] border border-bg-300/80 bg-[linear-gradient(180deg,rgba(250,249,245,0.9),rgba(240,238,230,0.85))] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-text-300">
            <Bot className="h-4 w-4 text-accent" />
            Capacidades activas
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill active={!!overview?.capabilities.jellyfinConfigured} label="Jellyfin" />
            <StatusPill active={!!overview?.capabilities.tmdbConfigured} label="TMDB" />
            <StatusPill active={!!overview?.capabilities.assistantConfigured} label="IA" />
          </div>
          <p className="mt-3 text-sm leading-6 text-text-300">
            {overview?.sync.lastRefreshAt
              ? `Última sincronización: ${formatter.format(new Date(overview.sync.lastRefreshAt))}.`
              : "Todavía no hay sincronización confirmada con Jellyfin."}
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_-32px_rgba(44,38,30,0.28)] backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-text-400">
          <Sparkles className="h-4 w-4 text-accent" />
          Auditoría TMDB
        </div>
        <h3 className="mt-2 text-lg font-semibold text-text-100">
          {overview?.audit.configured
            ? `${overview.audit.count} series con revisión pendiente`
            : "Auditoría avanzada no disponible"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-text-300">
          {overview?.audit.message ??
            "Cuando TMDB esté configurado, aquí verás discrepancias entre lo local y lo remoto."}
        </p>

        <div className="mt-4 space-y-3">
          {overview?.audit.items.length ? (
            overview.audit.items.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-bg-300/80 bg-bg-0/80 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text-100">{item.name}</p>
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    +{item.missingSeasons}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-300">
                  Local {item.localSeasons} · TMDB {item.remoteSeasons} · {item.status}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-bg-300 px-4 py-4 text-sm text-text-400">
              {overview?.audit.lastError
                ? `La auditoría falló: ${overview.audit.lastError}`
                : "No hay discrepancias recientes en la muestra auditada."}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_-32px_rgba(44,38,30,0.28)] backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-text-400">
          <AlertCircle className="h-4 w-4 text-accent" />
          Acciones rápidas
        </div>
        <div className="mt-4 grid gap-3">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => onQuickPrompt(prompt)}
              className="rounded-2xl border border-bg-300 bg-bg-0 px-4 py-3 text-left text-sm text-text-200 transition hover:border-accent hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

interface MetricCardProps {
  icon: typeof Film;
  label: string;
  value: number;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <div className="rounded-[24px] border border-bg-300/80 bg-bg-0 px-4 py-4">
      <div className="flex items-center gap-2 text-text-400">
        <Icon className="h-4 w-4 text-accent" />
        <span className="text-xs uppercase tracking-[0.24em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-text-100">{value}</p>
    </div>
  );
}

interface StatusPillProps {
  active: boolean;
  label: string;
}

function StatusPill({ active, label }: StatusPillProps) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-bg-300 bg-bg-0 text-text-400",
      )}
    >
      {label}
    </span>
  );
}
