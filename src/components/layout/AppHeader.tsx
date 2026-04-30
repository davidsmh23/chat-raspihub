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
        borderBottom: "1px solid rgba(201,168,76,0.1)",
        background: "color-mix(in srgb, var(--color-bg) 88%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.06) 100%)",
            border: "1px solid rgba(201,168,76,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              lineHeight: 1,
            }}
          >
            R
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.05rem",
            fontWeight: 300,
            letterSpacing: "0.28em",
            background: "linear-gradient(135deg, #e8c96a 0%, #c9a84c 55%, #a07830 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          RaspiHub
        </h1>
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Status pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 4px",
          }}
        >
          <StatusPill active={jellyfin} label="Jellyfin" />
          <StatusPill active={tmdb} label="TMDB" />
          <StatusPill active={ai} label="IA" />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: "rgba(201,168,76,0.15)",
            margin: "0 2px",
          }}
        />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          style={{
            width: 32,
            height: 30,
            borderRadius: 9,
            border: "1px solid rgba(201,168,76,0.16)",
            background: "rgba(201,168,76,0.05)",
            color: "var(--color-text-muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "color 0.15s ease, border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "var(--color-accent)";
            btn.style.borderColor = "rgba(201,168,76,0.32)";
            btn.style.background = "rgba(201,168,76,0.09)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "var(--color-text-muted)";
            btn.style.borderColor = "rgba(201,168,76,0.16)";
            btn.style.background = "rgba(201,168,76,0.05)";
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
        padding: "3px 8px",
        borderRadius: 99,
        background: active ? "rgba(63,185,80,0.07)" : "rgba(100,100,120,0.07)",
        border: `1px solid ${active ? "rgba(63,185,80,0.18)" : "rgba(100,100,120,0.12)"}`,
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: active ? "#3fb950" : "#505060",
          boxShadow: active ? "0 0 6px rgba(63,185,80,0.8)" : "none",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.58rem",
          letterSpacing: "0.05em",
          fontWeight: 500,
          color: active ? "#3fb950" : "#606070",
          transition: "color 0.2s ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}
