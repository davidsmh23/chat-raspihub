import { useEffect, useRef } from "react";
import gsap from "gsap";

import { BackdropCarousel } from "@/components/media/BackdropCarousel";
import { ParticleScene } from "@/components/three/ParticleScene";
import type { LibraryOverviewPayload } from "@/types/api";

interface CinematicHeroProps {
  overview: LibraryOverviewPayload | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const TITLE = "RASPI HUB";

export function CinematicHero({ overview, isLoading, onRefresh }: CinematicHeroProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<HTMLButtonElement>(null);

  const backdrops = [
    ...(overview?.movies.items.filter((i) => i.backdropUrl).map((i) => i.backdropUrl!) ?? []),
    ...(overview?.series.items.filter((i) => i.backdropUrl).map((i) => i.backdropUrl!) ?? []),
  ].slice(0, 8);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    const chars = title.querySelectorAll(".hero-char");
    gsap.from(chars, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.04,
      ease: "power3.out",
      delay: 0.6,
    });
  }, []);

  useEffect(() => {
    if (!statsRef.current || !overview) return;
    const els = statsRef.current.querySelectorAll("[data-count]");
    els.forEach((el) => {
      const target = parseInt(el.getAttribute("data-count") ?? "0", 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        ease: "power2.out",
        delay: 1.0,
        onUpdate: () => {
          el.textContent = Math.round(obj.val).toString();
        },
      });
    });
  }, [overview]);

  useEffect(() => {
    const btn = refreshRef.current;
    if (!btn || !isLoading) return;
    const spin = gsap.to(btn.querySelector("svg"), {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: "linear",
    });
    return () => { spin.kill(); };
  }, [isLoading]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "min(520px, 55vh)", minHeight: 320 }}
    >
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <BackdropCarousel backdrops={backdrops} />
      </div>

      <ParticleScene />

      <div
        className="absolute inset-0 flex flex-col justify-end"
        style={{ zIndex: 10, padding: "clamp(24px, 5vw, 56px)" }}
      >
        <h1
          ref={titleRef}
          aria-label={TITLE}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-hero)",
            fontWeight: 300,
            letterSpacing: "0.2em",
            lineHeight: 1,
            marginBottom: "clamp(12px, 2vw, 20px)",
            background: "linear-gradient(135deg, #e8c96a 0%, #c9a84c 40%, #a07830 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {TITLE.split("").map((char, i) => (
            <span key={i} className="hero-char" style={{ display: "inline-block" }}>
              {char === " " ? " " : char}
            </span>
          ))}
        </h1>

        <div ref={statsRef} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <StatBadge
            count={overview?.stats.movies ?? 0}
            label="películas"
          />
          <StatDivider />
          <StatBadge
            count={overview?.stats.series ?? 0}
            label="series"
          />
          <div className="flex items-center gap-3 ml-2">
            <StatusDot active={!!overview?.sync.isConnected} label="Jellyfin" />
            <StatusDot active={!!overview?.capabilities.tmdbConfigured} label="TMDB" />
            <StatusDot active={!!overview?.capabilities.assistantConfigured} label="IA" />
          </div>
        </div>
      </div>

      <button
        ref={refreshRef}
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Actualizar biblioteca"
        style={{
          position: "absolute",
          top: "clamp(16px, 3vw, 32px)",
          right: "clamp(16px, 3vw, 32px)",
          zIndex: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(10,10,15,0.7)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: "#c9a84c",
          cursor: isLoading ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(10,10,15,0.7)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
    </div>
  );
}

function StatBadge({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        data-count={count}
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
          color: "#c9a84c",
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
          color: "#9a9080",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 300,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StatDivider() {
  return (
    <span
      style={{
        width: 1,
        height: 24,
        background: "rgba(201,168,76,0.25)",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#4ade80" : "#8b0000",
          boxShadow: active ? "0 0 6px rgba(74,222,128,0.7)" : "0 0 6px rgba(139,0,0,0.7)",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.65rem",
          color: "#9a9080",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
