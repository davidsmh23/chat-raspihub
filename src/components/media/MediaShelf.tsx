import { useRef, useState } from "react";

import { useMediaHighlight } from "@/contexts/media-highlight-context";
import type { LibraryItem } from "@/types/api";
import { MediaCard } from "./MediaCard";

interface MediaShelfProps {
  title: string;
  items: LibraryItem[];
  totalCount: number;
}

export function MediaShelf({ title, items, totalCount }: MediaShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { highlighted } = useMediaHighlight();

  const visibleItems = expanded ? items : items.slice(0, 12);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-4">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-display)",
              color: "#f5f0e8",
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h2>
          <div
            style={{
              height: 1,
              width: 60,
              background: "linear-gradient(90deg, #c9a84c 0%, transparent 100%)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.7rem",
              color: "#7a6128",
              letterSpacing: "0.1em",
            }}
          >
            {totalCount}
          </span>
        </div>

        {items.length > 12 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.7rem",
              color: "#c9a84c",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              padding: "4px 12px",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      {expanded ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 16,
            paddingBottom: 8,
          }}
        >
          {visibleItems.map((item) => (
            <MediaCard
              key={item.id ?? item.name}
              item={item}
              isHighlighted={
                !!highlighted &&
                item.name.toLowerCase() === highlighted.toLowerCase()
              }
            />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="shelf-scroll"
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 12,
            paddingTop: 4,
          }}
        >
          {visibleItems.map((item) => (
            <MediaCard
              key={item.id ?? item.name}
              item={item}
              isHighlighted={
                !!highlighted &&
                item.name.toLowerCase() === highlighted.toLowerCase()
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
