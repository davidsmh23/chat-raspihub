import type { LibraryOverviewPayload } from "@/types/api";

interface AppHeaderProps {
  overview: LibraryOverviewPayload | null;
}

export function AppHeader({ overview }: AppHeaderProps) {
  const jellyfin = overview?.sync.isConnected ?? false;
  const tmdb = overview?.capabilities.tmdbConfigured ?? false;
  const ai = overview?.capabilities.assistantConfigured ?? false;

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          fontWeight: 300,
          letterSpacing: "0.25em",
          background: "linear-gradient(135deg, #e8c96a 0%, #c9a84c 60%, #a07830 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        RaspiHub
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StatusDot active={jellyfin} label="Jellyfin" />
        <StatusDot active={tmdb} label="TMDB" />
        <StatusDot active={ai} label="IA" />
      </div>
    </header>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: active ? "#4ade80" : "#8b0000",
          boxShadow: active ? "0 0 5px rgba(74,222,128,0.8)" : "0 0 5px rgba(139,0,0,0.8)",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.6rem",
          color: "#9a9080",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
