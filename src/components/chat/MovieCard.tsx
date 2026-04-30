import { Clock3, ExternalLink, Film, Star, Tv } from "lucide-react";

import type { RecommendationItem } from "@/types/api";

interface RecommendationCardProps {
  item: RecommendationItem;
  animationDelay?: number;
}

function formatRuntime(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function InitialPoster({ title, type }: { title: string; type: string }) {
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="recommendation-poster-fallback">
      {type.toLowerCase().includes("serie") ? <Tv size={24} /> : <Film size={24} />}
      <span>{initials}</span>
    </div>
  );
}

export function RecommendationCard({ item, animationDelay = 0 }: RecommendationCardProps) {
  const runtime = formatRuntime(item.runtimeMinutes);
  const showRating = typeof item.rating === "number" && Number.isFinite(item.rating);
  const genres = item.genres?.slice(0, 3).join(" | ");

  return (
    <article
      className="recommendation-card animate-card"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="recommendation-poster-wrap">
        {item.posterUrl ? (
          <img src={item.posterUrl} alt={item.title} className="recommendation-poster" />
        ) : (
          <InitialPoster title={item.title} type={item.type} />
        )}
        <span className={`recommendation-type-pill ${item.type.toLowerCase().includes("serie") ? "series" : ""}`}>
          {item.type}
        </span>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-head">
          <h4>{item.title}</h4>
          {showRating && (
            <span className="recommendation-rating">
              <Star size={12} fill="currentColor" />
              {item.rating?.toFixed(1)}
            </span>
          )}
        </div>

        <div className="recommendation-meta">
          {item.year && <span>{item.year}</span>}
          {runtime && (
            <span>
              <Clock3 size={12} />
              {runtime}
            </span>
          )}
          {genres && <span>{genres}</span>}
        </div>

        {item.reason && <p className="recommendation-reason">{item.reason}</p>}
        {item.description && <p className="recommendation-description">{item.description}</p>}

        <div className="recommendation-footer">
          {item.jellyfin.available && item.jellyfin.playUrl ? (
            <a
              href={item.jellyfin.playUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="recommendation-play"
            >
              Ver en Jellyfin
              <ExternalLink size={13} />
            </a>
          ) : (
            <span className="recommendation-unavailable">No disponible en Jellyfin</span>
          )}
          <span className={`recommendation-status ${item.jellyfin.available ? "available" : "missing"}`}>
            {item.jellyfin.statusMessage}
          </span>
        </div>
      </div>
    </article>
  );
}

interface RecommendationGridProps {
  items: RecommendationItem[];
}

export function RecommendationGrid({ items }: RecommendationGridProps) {
  if (!items.length) return null;

  return (
    <div className="recommendation-grid">
      {items.map((item, index) => (
        <RecommendationCard
          key={`${item.title}-${item.year ?? "na"}-${index}`}
          item={item}
          animationDelay={index * 70}
        />
      ))}
    </div>
  );
}
