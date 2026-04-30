import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { useMediaHighlight } from "@/contexts/media-highlight-context";
import type { LibraryItem } from "@/types/api";

interface MediaCardProps {
  item: LibraryItem;
  isHighlighted?: boolean;
}

export function MediaCard({ item, isHighlighted }: MediaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { highlight } = useMediaHighlight();

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.set(cardRef.current, { transformPerspective: 800 });
    quickX.current = gsap.quickTo(cardRef.current, "rotateX", {
      duration: 0.35,
      ease: "power2.out",
    });
    quickY.current = gsap.quickTo(cardRef.current, "rotateY", {
      duration: 0.35,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    if (isHighlighted) {
      gsap.to(cardRef.current, {
        scale: 1.06,
        duration: 0.4,
        ease: "back.out(1.5)",
        boxShadow: "0 0 0 2px #c9a84c, 0 0 32px rgba(201,168,76,0.5)",
      });
    } else {
      gsap.to(cardRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "none",
      });
    }
  }, [isHighlighted]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = ((y / rect.height) - 0.5) * -14;
    const tiltY = ((x / rect.width) - 0.5) * 14;
    quickX.current?.(tiltX);
    quickY.current?.(tiltY);
    setLightPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    gsap.to(cardRef.current, { scale: 1.05, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    quickX.current?.(0);
    quickY.current?.(0);
    if (!isHighlighted) {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
    }
  };

  const showImage = item.hasPrimaryImage && item.imageUrl && !imgError;
  const stars = item.communityRating ? Math.round(item.communityRating / 2) : 0;

  return (
    <div
      ref={cardRef}
      className="shelf-item relative cursor-pointer"
      style={{ width: 150, minWidth: 150, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => highlight(item.name)}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: 150,
          height: 225,
          borderRadius: 8,
          background: showImage
            ? "transparent"
            : "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
          boxShadow: isHighlighted
            ? "0 0 0 2px #c9a84c, 0 8px 32px rgba(0,0,0,0.7)"
            : "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(201,168,76,0.08)",
          transition: "box-shadow 0.3s ease",
        }}
      >
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <PlaceholderPoster name={item.name} year={item.year} />
        )}

        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${lightPos.x}% ${lightPos.y}%, rgba(255,255,255,0.12) 0%, transparent 65%)`,
            }}
          />
        )}

        {item.officialRating && (
          <span
            className="absolute top-2 right-2 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(0,0,0,0.75)",
              color: "#9a9080",
              border: "1px solid rgba(154,144,128,0.4)",
              fontFamily: "var(--font-ui)",
              letterSpacing: "0.05em",
            }}
          >
            {item.officialRating}
          </span>
        )}

        {item.type === "Series" && item.localSeasons != null && (
          <span
            className="absolute bottom-2 left-2 text-[9px] font-mono font-medium px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(201,168,76,0.9)",
              color: "#0a0a0f",
              fontFamily: "var(--font-ui)",
            }}
          >
            {item.localSeasons}T
          </span>
        )}

        {isHovered && (
          <div
            className="absolute inset-0 flex flex-col justify-end p-3"
            style={{
              background:
                "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 50%, transparent 100%)",
            }}
          >
            <p
              className="text-[11px] font-semibold leading-tight mb-1 line-clamp-2"
              style={{ fontFamily: "var(--font-display)", color: "#f5f0e8", fontSize: "0.75rem" }}
            >
              {item.name}
            </p>
            {item.year && (
              <p
                className="text-[10px]"
                style={{ fontFamily: "var(--font-ui)", color: "#9a9080" }}
              >
                {item.year}
              </p>
            )}
            {stars > 0 && (
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < stars ? "#c9a84c" : "#3a3a4a", fontSize: 10 }}>
                    ★
                  </span>
                ))}
              </div>
            )}
            {item.overview && (
              <p
                className="mt-1.5 text-[9px] leading-[1.4] line-clamp-3"
                style={{ fontFamily: "var(--font-body)", color: "#9a9080" }}
              >
                {item.overview}
              </p>
            )}
          </div>
        )}
      </div>

      {!isHovered && (
        <p
          className="mt-2 text-[11px] leading-tight line-clamp-1 px-0.5"
          style={{ fontFamily: "var(--font-display)", color: "#9a9080", fontSize: "0.7rem" }}
        >
          {item.name}
        </p>
      )}
    </div>
  );
}

function PlaceholderPoster({ name, year }: { name: string; year?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-3"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #1a1a3e 0%, #0a0a0f 60%), " +
          "radial-gradient(ellipse at 70% 80%, #16213e 0%, transparent 60%)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.5rem",
          fontWeight: 300,
          color: "rgba(201,168,76,0.5)",
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}
      >
        {initials}
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "0.65rem",
          color: "rgba(201,168,76,0.4)",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>
      {year && (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.6rem",
            color: "rgba(154,144,128,0.5)",
            marginTop: "0.25rem",
          }}
        >
          {year}
        </span>
      )}
    </div>
  );
}
