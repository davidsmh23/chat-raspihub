import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Save } from "lucide-react";

import type { ChatUiMessage, LibraryOverviewPayload } from "@/types/api";

interface AppSidebarProps {
  overview: LibraryOverviewPayload | null;
  messages: ChatUiMessage[];
  onSaveSession: () => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

const SIDEBAR_OPEN_WIDTH = 260;

export function AppSidebar({ overview, messages, onSaveSession, isSaving, lastSavedAt }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current || !contentRef.current) return;
    if (isOpen) {
      gsap.to(sidebarRef.current, { width: SIDEBAR_OPEN_WIDTH, duration: 0.3, ease: "power3.out" });
      gsap.to(contentRef.current, { opacity: 1, x: 0, duration: 0.25, delay: 0.1, ease: "power2.out" });
    } else {
      gsap.to(contentRef.current, { opacity: 0, x: -8, duration: 0.15, ease: "power2.in" });
      gsap.to(sidebarRef.current, { width: 0, duration: 0.25, delay: 0.1, ease: "power3.in" });
    }
  }, [isOpen]);

  const auditCount = overview?.audit.count ?? 0;
  const auditItems = overview?.audit.items ?? [];
  const conversationCount = messages.filter((m) => m.id !== "welcome").length;

  const formatter = new Intl.DateTimeFormat("es-ES", { timeStyle: "short", dateStyle: "short" });

  return (
    <div style={{ display: "flex", position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "Cerrar panel" : "Abrir panel"}
        style={{
          width: 28,
          flexShrink: 0,
          background: "rgba(16,14,10,0.9)",
          border: "1px solid rgba(201,168,76,0.12)",
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "16px 0",
          color: "#9a9080",
          transition: "color 0.2s, border-color 0.2s",
          alignSelf: "stretch",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#c9a84c";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#9a9080";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.12)";
        }}
      >
        {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        <BookOpen size={12} />
        {auditCount > 0 && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.55rem",
              color: "#cc3333",
              writingMode: "vertical-rl",
            }}
          >
            {auditCount}
          </span>
        )}
      </button>

      <div
        ref={sidebarRef}
        style={{ width: SIDEBAR_OPEN_WIDTH, overflow: "hidden", flexShrink: 0 }}
      >
        <div
          ref={contentRef}
          style={{
            width: SIDEBAR_OPEN_WIDTH,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            background: "rgba(10,10,15,0.95)",
            borderRight: "1px solid rgba(201,168,76,0.1)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
          className="custom-scrollbar"
        >
          {/* Biblioteca */}
          <SidebarSection label="Biblioteca">
            {overview ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <StatRow
                  label="Películas"
                  value={String(overview.stats.movies)}
                />
                <StatRow
                  label="Series"
                  value={String(overview.stats.series)}
                />
                <StatRow
                  label="Total"
                  value={String(overview.stats.totalItems)}
                />
                {overview.sync.lastRefreshAt && (
                  <p
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.58rem",
                      color: "#6a6050",
                      marginTop: 4,
                    }}
                  >
                    Sync: {formatter.format(new Date(overview.sync.lastRefreshAt))}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "#6a6050" }}>
                Cargando...
              </p>
            )}
          </SidebarSection>

          {/* Auditoría */}
          {(auditCount > 0 || overview?.audit.configured) && (
            <SidebarSection
              label="Auditoría TMDB"
              icon={<AlertTriangle size={11} color={auditCount > 0 ? "#cc3333" : "#9a9080"} />}
            >
              {auditItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {auditItems.slice(0, 5).map((item) => (
                    <div
                      key={item.name}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 6,
                        background: "rgba(139,0,0,0.08)",
                        border: "1px solid rgba(139,0,0,0.2)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.7rem",
                          color: "#f5f0e8",
                          marginBottom: 2,
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.58rem",
                          color: "#9a9080",
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
                        fontSize: "0.6rem",
                        color: "#6a6050",
                        textAlign: "center",
                      }}
                    >
                      +{auditItems.length - 5} más
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "#6a6050" }}>
                  Sin discrepancias detectadas.
                </p>
              )}
            </SidebarSection>
          )}

          {/* Sesión actual */}
          <SidebarSection label="Sesión actual">
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.65rem",
                color: "#9a9080",
                marginBottom: 10,
              }}
            >
              {conversationCount > 0
                ? `${conversationCount} mensaje${conversationCount !== 1 ? "s" : ""} en esta sesión`
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
                borderRadius: 8,
                border: "1px solid rgba(201,168,76,0.25)",
                background:
                  isSaving || conversationCount === 0
                    ? "rgba(201,168,76,0.04)"
                    : "rgba(201,168,76,0.1)",
                color:
                  isSaving || conversationCount === 0 ? "#6a6050" : "#c9a84c",
                fontFamily: "var(--font-ui)",
                fontSize: "0.68rem",
                letterSpacing: "0.06em",
                cursor:
                  isSaving || conversationCount === 0 ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSaving && conversationCount > 0) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  isSaving || conversationCount === 0
                    ? "rgba(201,168,76,0.04)"
                    : "rgba(201,168,76,0.1)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.25)";
              }}
            >
              <Save size={12} />
              {isSaving ? "Guardando..." : "Guardar sesión"}
            </button>

            {lastSavedAt && (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.58rem",
                  color: "#4ade80",
                  marginTop: 6,
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
        padding: "16px 14px",
        borderBottom: "1px solid rgba(201,168,76,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.58rem",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#6a6050",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "#9a9080" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.8rem",
          color: "#c9a84c",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}
