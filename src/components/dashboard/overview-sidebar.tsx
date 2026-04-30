import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AlertTriangle } from "lucide-react";

import type { LibraryOverviewPayload } from "@/types/api";

interface AuditSidebarProps {
  overview: LibraryOverviewPayload | null;
}

export function AuditSidebar({ overview }: AuditSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const auditCount = overview?.audit.count ?? 0;
  const auditItems = overview?.audit.items ?? [];

  useEffect(() => {
    if (!panelRef.current || !contentRef.current) return;

    if (isOpen) {
      gsap.to(panelRef.current, {
        width: "clamp(240px, 20vw, 300px)",
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(contentRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.out",
      });
    } else {
      gsap.to(contentRef.current, {
        opacity: 0,
        x: -10,
        duration: 0.2,
        ease: "power2.in",
      });
      gsap.to(panelRef.current, {
        width: 0,
        duration: 0.3,
        delay: 0.15,
        ease: "power3.in",
      });
    }
  }, [isOpen]);

  const formatter = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "Cerrar auditoría" : "Ver auditoría TMDB"}
        style={{
          width: 28,
          flexShrink: 0,
          background: isOpen ? "rgba(139,0,0,0.15)" : "rgba(26,26,46,0.8)",
          border: `1px solid ${isOpen ? "rgba(139,0,0,0.5)" : "rgba(201,168,76,0.15)"}`,
          borderRadius: 8,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "16px 0",
          transition: "all 0.2s ease",
          color: isOpen ? "#cc3333" : "#9a9080",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,0,0,0.4)";
            (e.currentTarget as HTMLButtonElement).style.color = "#cc3333";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#9a9080";
          }
        }}
      >
        <AlertTriangle size={14} />
        {auditCount > 0 && (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.6rem",
              color: "#cc3333",
              fontWeight: 500,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              letterSpacing: "0.05em",
            }}
          >
            {auditCount}
          </span>
        )}
      </button>

      <div
        ref={panelRef}
        style={{
          width: 0,
          overflow: "hidden",
          flexShrink: 0,
          height: "100%",
        }}
      >
        <div
          ref={contentRef}
          style={{
            opacity: 0,
            transform: "translateX(-10px)",
            width: "clamp(240px, 20vw, 300px)",
            height: "100%",
            background: "rgba(10,10,15,0.9)",
            border: "1px solid rgba(139,0,0,0.25)",
            borderRadius: 10,
            marginLeft: 8,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(139,0,0,0.2)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <AlertTriangle size={14} color="#8b0000" />
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#9a9080",
                }}
              >
                Auditoría TMDB
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                color: "#f5f0e8",
                fontWeight: 300,
              }}
            >
              {auditCount > 0
                ? `${auditCount} series incompletas`
                : overview?.audit.configured
                ? "Sin discrepancias"
                : "Sin configurar"}
            </p>
            {overview?.audit.lastAuditedAt && (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.6rem",
                  color: "#9a9080",
                  marginTop: 4,
                }}
              >
                {formatter.format(new Date(overview.audit.lastAuditedAt))}
              </p>
            )}
          </div>

          <div
            className="custom-scrollbar"
            style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}
          >
            {auditItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {auditItems.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "rgba(139,0,0,0.08)",
                      border: "1px solid rgba(139,0,0,0.25)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.8rem",
                          color: "#f5f0e8",
                          lineHeight: 1.3,
                          fontWeight: 400,
                        }}
                      >
                        {item.name}
                      </p>
                      <span
                        style={{
                          flexShrink: 0,
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.6rem",
                          color: "#cc3333",
                          background: "rgba(139,0,0,0.2)",
                          border: "1px solid rgba(139,0,0,0.4)",
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontWeight: 500,
                        }}
                      >
                        INCOMPLETA
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.6rem",
                        color: "#9a9080",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Local {item.localSeasons}T · TMDB {item.remoteSeasons}T · +{item.missingSeasons}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "20px 12px",
                  textAlign: "center",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: "#9a9080",
                  lineHeight: 1.6,
                }}
              >
                {overview?.audit.lastError
                  ? `Error: ${overview.audit.lastError}`
                  : overview?.audit.configured
                  ? "No hay discrepancias recientes."
                  : "Configura TMDB para activar la auditoría."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
