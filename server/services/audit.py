from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from server.config import Settings


class TmdbAuditService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._cached_summary: dict[str, Any] | None = None
        self._last_built_at: datetime | None = None
        self._last_error: str | None = None

    def _is_cache_valid(self) -> bool:
        if not self._cached_summary or not self._last_built_at:
            return False
        age = datetime.now(timezone.utc) - self._last_built_at
        return age < timedelta(seconds=self.settings.tmdb_audit_ttl_seconds)

    def _empty_summary(self, *, message: str) -> dict[str, Any]:
        return {
            "configured": bool(self.settings.tmdb_api_key),
            "message": message,
            "items": [],
            "count": 0,
            "lastAuditedAt": self._last_built_at.isoformat() if self._last_built_at else None,
            "lastError": self._last_error,
        }

    def _fetch_show(self, name: str) -> dict[str, Any] | None:
        if not self.settings.tmdb_api_key:
            return None

        search_url = "https://api.themoviedb.org/3/search/tv"
        search = requests.get(
            search_url,
            params={"api_key": self.settings.tmdb_api_key, "query": name},
            timeout=20,
        )
        search.raise_for_status()
        results = search.json().get("results", [])
        if not results:
            return None

        show_id = results[0]["id"]
        detail = requests.get(
            f"https://api.themoviedb.org/3/tv/{show_id}",
            params={"api_key": self.settings.tmdb_api_key},
            timeout=20,
        )
        detail.raise_for_status()
        return detail.json()

    def get_summary(self, series: list[dict[str, Any]]) -> dict[str, Any]:
        if not self.settings.tmdb_api_key:
            return self._empty_summary(
                message="TMDB no está configurado; la auditoría avanzada de temporadas no está disponible."
            )

        if self._is_cache_valid():
            return self._cached_summary or {}

        items: list[dict[str, Any]] = []
        try:
            for item in series:
                show = self._fetch_show(item["name"])
                if not show:
                    continue

                remote_seasons = int(show.get("number_of_seasons") or 0)
                local_seasons = int(item.get("localSeasons") or 0)

                if remote_seasons > local_seasons:
                    items.append(
                        {
                            "name": item["name"],
                            "localSeasons": local_seasons,
                            "remoteSeasons": remote_seasons,
                            "missingSeasons": remote_seasons - local_seasons,
                            "status": show.get("status", "Unknown"),
                        }
                    )

            self._last_built_at = datetime.now(timezone.utc)
            self._last_error = None
            self._cached_summary = {
                "configured": True,
                "message": "Auditoría TMDB generada correctamente.",
                "items": items[:6],
                "count": len(items),
                "lastAuditedAt": self._last_built_at.isoformat(),
                "lastError": None,
            }
        except Exception as exc:
            self._last_error = str(exc)
            self._cached_summary = {
                "configured": True,
                "message": "No se pudo completar la auditoría de TMDB en este momento.",
                "items": [],
                "count": 0,
                "lastAuditedAt": None,
                "lastError": self._last_error,
            }

        return self._cached_summary

    def peek_summary(self) -> dict[str, Any]:
        if not self.settings.tmdb_api_key:
            return self._empty_summary(
                message="TMDB no está configurado; la auditoría avanzada de temporadas no está disponible."
            )
        if self._cached_summary:
            return self._cached_summary
        return self._empty_summary(
            message="La auditoría TMDB se ejecutará cuando la solicites desde el chat."
        )

    def health_snapshot(self) -> dict[str, Any]:
        return {
            "configured": bool(self.settings.tmdb_api_key),
            "lastAuditedAt": self._last_built_at.isoformat() if self._last_built_at else None,
            "lastError": self._last_error,
        }
