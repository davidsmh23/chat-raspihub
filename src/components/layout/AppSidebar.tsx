import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Database, Save } from "lucide-react";

import type { ChatUiMessage, LibraryOverviewPayload } from "@/types/api";

interface AppSidebarProps {
  overview: LibraryOverviewPayload | null;
  messages: ChatUiMessage[];
  onSaveSession: () => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

const SIDEBAR_WIDTH = 252;

export function AppSidebar({
  overview,
  messages,
  onSaveSession,
  isSaving,
  lastSavedAt,
}: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current || !contentRef.current) return;
    if (isOpen) {
      gsap.to(sidebarRef.current, { width: SIDEBAR_WIDTH, duration: 0.3, ease: "power3.out" });
      gsap.to(contentRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.22,
        delay: 0.1,
        ease: "power2.out",
      });
    } else {
      gsap.to(contentRef.current, { opacity: 0, x: -6, duration: 0.14, ease: "power2.in" });
      gsap.to(sidebarRef.current, { width: 0, duration: 0.24, delay: 0.1, ease: "power3.in" });
    }
  }, [isOpen]);

  const auditCount = overview?.audit.count ?? 0;
  const auditItems = overview?.audit.items ?? [];
  const conversationCount = messages.filter((m) => m.id !== "welcome").length;

  const formatter = new Intl.DateTimeFormat("es-ES", {
    timeStyle: "short",
    dateStyle: "short",
  });

  return (
    <div style={{ display: "flex", position: "relative", flexShrink: 0 }}>
      {/* Toggle strip */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "Cerrar panel" : "Abrir panel"}
        style={{
          width: 26,
          flexShrink: 0,
          background: "color-mix(in srgb, var(--color-surface) 70%, transparent)",
          border: "1px solid rgba(201,168,76,0.1)",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 0",
          color: "var(--color-text-muted)",
          transition: "color 0.2s, border-color 0.2s, background 0.2s",
          alignSelf: "stretch",
          margin: "8px 0",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.color = "var(--color-accent)";
          btn.style.borderColor = "rgba(201,168,76,0.28)";
          btn.style.background = "rgba(201,168,76,0.07)";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.color = "var(--color-text-muted)";
          btn.style.borderColor = "rgba(201,168,76,0.1)";
          btn.style.background = "color-mix(in srgb, var(--color-surface) 70%, transparent)";
        }}
      >
        {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        <BookOpen size={11} />
        {auditCount > 0 && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.52rem",
              color: "#e05555",
              writingMode: "vertical-rl",
              fontWeight: 600,
            }}
          >
            {auditCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        ref={sidebarRef}
        style={{ width: SIDEBAR_WIDTH, overflow: "hidden", flexShrink: 0 }}
      >
        <div
          ref={contentRef}
          className="custom-scrollbar"
          style={{
            width: SIDEBAR_WIDTH,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
            borderRight: "1px solid rgba(201,168,76,0.08)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Library section */}
          <SidebarSection label="Biblioteca" icon={<Database size={11} color="var(--color-text-muted)" />}>
            {overview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <StatRow label="Películas" value={String(overview.stats.movies)} />
                <StatRow label="Series" value={String(overview.stats.series)} />
                <div
                  style={{
                    height: 1,
                    background: "rgba(201,168,76,0.08)",
                    margin: "3px 0",
                  }}
                />
                <StatRow label="Total" value={String(overview.stats.totalItems)} accent />
                {overview.sync.lastRefreshAt && (
                  <p
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.56rem",
                      color: "color-mix(in srgb, var(--color-text-muted) 55%, transparent)",
                      marginTop: 4,
                    }}
                  >
                    Sync: {formatter.format(new Date(overview.sync.lastRefreshAt))}
                  </p>
                )}
              </div>
            ) : (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.65rem",
                  color: "color-mix(in srgb, var(--color-text-muted) 55%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(201,168,76,0.3)",
                    borderTopColor: "var(--color-accent)",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Cargando…
              </p>
            )}
          </SidebarSection>

          {/* Audit section */}
          {(auditCount > 0 || overview?.audit.configured) && (
            <SidebarSection
              label="Auditoría TMDB"
              icon={
                <AlertTriangle
                  size={11}
                  color={auditCount > 0 ? "#e05555" : "var(--color-text-muted)"}
                />
              }
            >
              {auditItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {auditItems.slice(0, 5).map((item) => (
                    <div
                      key={item.name}
                      style={{
                        padding: "7px 9px",
                        borderRadius: 7,
                        background: "rgba(139,0,0,0.07)",
                        border: "1px solid rgba(139,0,0,0.18)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.68rem",
                          color: "var(--color-text)",
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.57rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Local {item.localSeasons}T · TMDB {item.remoteSeasons}T
                      </p>
                    </div>
                  ))}
                  {auditItems.length > 5 && (
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.58rem",
                        color: "color-mix(in srgb, var(--color-text-muted) 55%, transparent)",
                        textAlign: "center",
                        padding: "2px 0",
                      }}
                    >
                      +{auditItems.length - 5} más
                    </p>
                  )}
                </div>
              ) : (
                <p
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.65rem",
                    color: "color-mix(in srgb, var(--color-text-muted) 55%, transparent)",
                  }}
                >
                  Sin discrepancias detectadas.
                </p>
              )}
            </SidebarSection>
          )}

          {/* Session section */}
          <SidebarSection label="Sesión actual">
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.63rem",
                color: "var(--color-text-muted)",
                marginBottom: 10,
              }}
            >
              {conversationCount > 0
                ? `${conversationCount} mensaje${conversationCount !== 1 ? "s" : ""}`
                : "Sin mensajes todavía."}
            </p>

            <button
              onClick={onSaveSession}
              disabled={isSaving || conversationCount === 0}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "8px 12px",
                borderRadius: 9,
                border: "1px solid rgba(201,168,76,0.2)",
                background:
                  isSaving || conversationCount === 0
                    ? "rgba(201,168,76,0.04)"
                    : "rgba(201,168,76,0.09)",
                color:
                  isSaving || conversationCount === 0
                    ? "color-mix(in srgb, var(--color-text-muted) 55%, transparent)"
                    : "var(--color-accent)",
                fontFamily: "var(--font-ui)",
                fontSize: "0.66rem",
                letterSpacing: "0.06em",
                cursor: isSaving || conversationCount === 0 ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaving && conversationCount > 0) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.background = "rgba(201,168,76,0.14)";
                  btn.style.borderColor = "rgba(201,168,76,0.38)";
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background =
                  isSaving || conversationCount === 0
                    ? "rgba(201,168,76,0.04)"
                    : "rgba(201,168,76,0.09)";
                btn.style.borderColor = "rgba(201,168,76,0.2)";
              }}
            >
              <Save size={12} />
              {isSaving ? "Guardando…" : "Guardar sesión"}
            </button>

            {lastSavedAt && (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.57rem",
                  color: "#3fb950",
                  marginTop: 7,
                  textAlign: "center",
                }}
              >
                Guardado a las {formatter.format(lastSavedAt)}
              </p>
            )}
          </SidebarSection>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 14px",
        borderBottom: "1px solid rgba(201,168,76,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          marginBottom: 10,
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.56rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "color-mix(in srgb, var(--color-text-muted) 65%, transparent)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.63rem",
          color: accent
            ? "var(--color-text-muted)"
            : "color-mix(in srgb, var(--color-text-muted) 75%, transparent)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: accent ? "0.88rem" : "0.78rem",
          color: "var(--color-accent)",
          fontWeight: accent ? 600 : 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}
