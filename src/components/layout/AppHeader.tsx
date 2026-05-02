import { Moon, Sun } from "lucide-react";

import type { LibraryOverviewPayload } from "@/types/api";
import { useTheme } from "@/contexts/theme-context";

interface AppHeaderProps {
  overview: LibraryOverviewPayload | null;
}

export function AppHeader({ overview }: AppHeaderProps) {
  const jellyfin = overview?.sync.isConnected ?? false;
  const tmdb = overview?.capabilities.tmdbConfigured ?? false;
  const ai = overview?.capabilities.assistantConfigured ?? false;
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        height: 54,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid var(--surface-border)",
        background: "var(--surface)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#100904",
              lineHeight: 1,
            }}
          >
            R
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.05rem",
            fontWeight: 400,
            letterSpacing: "0.22em",
            color: "var(--text)",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          RaspiHub
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 4px" }}>
          <StatusPill active={jellyfin} label="Jellyfin" />
          <StatusPill active={tmdb} label="TMDB" />
          <StatusPill active={ai} label="IA" />
        </div>

        <div style={{ width: 1, height: 18, background: "var(--surface-border)", margin: "0 2px" }} />

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          style={{
            width: 32,
            height: 30,
            borderRadius: 9,
            border: "1px solid var(--surface-border)",
            background: "transparent",
            color: "var(--muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "color 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "var(--accent)";
            btn.style.borderColor = "rgba(220, 80, 0, 0.35)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "var(--muted)";
            btn.style.borderColor = "var(--surface-border)";
          }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 99,
        background: active ? "rgba(76, 175, 114, 0.07)" : "transparent",
        border: `1px solid ${active ? "rgba(76, 175, 114, 0.2)" : "var(--surface-border)"}`,
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: active ? "#4CAF72" : "var(--muted)",
          boxShadow: active ? "0 0 6px rgba(76,175,114,0.7)" : "none",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.58rem",
          letterSpacing: "0.05em",
          fontWeight: 500,
          color: active ? "#4CAF72" : "var(--muted)",
          transition: "color 0.2s ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}
