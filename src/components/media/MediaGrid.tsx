import { useEffect, useRef } from "react";
import gsap from "gsap";

import { useMediaHighlight } from "@/contexts/media-highlight-context";
import type { LibraryOverviewPayload } from "@/types/api";
import { MediaShelf } from "./MediaShelf";

interface MediaGridProps {
  overview: LibraryOverviewPayload | null;
}

export function MediaGrid({ overview }: MediaGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setLibraryTitles, setLibraryItems } = useMediaHighlight();

  useEffect(() => {
    if (!overview) return;
    const titles = [
      ...overview.movies.items.map((i) => i.name),
      ...overview.series.items.map((i) => i.name),
    ];
    setLibraryTitles(titles);
    setLibraryItems([...overview.movies.items, ...overview.series.items]);
  }, [overview, setLibraryTitles, setLibraryItems]);

  useEffect(() => {
    if (!containerRef.current || !overview) return;
    const shelves = containerRef.current.querySelectorAll(".media-shelf-section");
    gsap.from(shelves, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.1,
    });
  }, [overview]);

  if (!overview) return null;

  return (
    <div
      ref={containerRef}
      style={{
        padding: "40px 0",
        display: "flex",
        flexDirection: "column",
        gap: 48,
      }}
    >
      {overview.movies.count > 0 && (
        <div className="media-shelf-section">
          <MediaShelf
            title="Películas"
            items={overview.movies.items}
            totalCount={overview.movies.count}
          />
        </div>
      )}

      {overview.series.count > 0 && (
        <div className="media-shelf-section">
          <MediaShelf
            title="Series"
            items={overview.series.items}
            totalCount={overview.series.count}
          />
        </div>
      )}
    </div>
  );
}
