import { useState } from "react";

import type { LibraryItem } from "@/types/api";

interface MovieCardProps {
  item: LibraryItem;
}

export function MovieCard({ item }: MovieCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showImage = item.hasPrimaryImage && item.imageUrl && !imgError;
  const rating = item.communityRating;
  const stars = rating ? Math.round(rating / 2) : 0;
  const genres = item.genres?.slice(0, 3).join(" · ") ?? "";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        gap: 12,
        maxWidth: 480,
        borderRadius: 10,
        border: isHovered
          ? "1px solid rgba(201,168,76,0.5)"
          : "1px solid rgba(201,168,76,0.18)",
        background: isHovered
          ? "rgba(26,22,12,0.95)"
          : "rgba(16,14,8,0.9)",
        padding: "10px 12px",
        transform: isHovered ? "scale(1.02)" : "scale(1)",
        transition: "all 0.2s ease",
        boxShadow: isHovered
          ? "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.2)"
          : "0 2px 12px rgba(0,0,0,0.4)",
        cursor: "default",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 72,
          height: 108,
          borderRadius: 6,
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
        }}
      >
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <PosterPlaceholder name={item.name} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#f5f0e8",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {item.name}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {item.year && (
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                color: "#9a9080",
              }}
            >
              {item.year}
            </span>
          )}
          {genres && (
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.65rem",
                color: "#7a7060",
                letterSpacing: "0.03em",
              }}
            >
              {genres}
            </span>
          )}
        </div>

        {rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    color: i < stars ? "#f59e0b" : "#2a2820",
                    fontSize: 11,
                    lineHeight: 1,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.68rem",
                color: "#c9a84c",
                fontWeight: 500,
              }}
            >
              {rating.toFixed(1)}
            </span>
          </div>
        )}

        {item.overview && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "#8a8070",
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.overview}
          </p>
        )}
      </div>
    </div>
  );
}

function PosterPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 30% 20%, #1a1a3e 0%, #0a0a0f 60%)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.6rem",
          fontWeight: 300,
          color: "rgba(201,168,76,0.5)",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

interface MovieCardGridProps {
  items: LibraryItem[];
}

export function MovieCardGrid({ items }: MovieCardGridProps) {
  if (items.length === 1) {
    return <MovieCard item={items[0]} />;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 8,
        maxWidth: 976,
      }}
    >
      {items.map((item) => (
        <MovieCard key={item.id ?? item.name} item={item} />
      ))}
    </div>
  );
}
