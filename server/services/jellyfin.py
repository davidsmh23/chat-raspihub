from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from typing import Any

import requests

from server.config import Settings


class JellyfinLibraryService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._lock = threading.Lock()
        self._movies: list[dict[str, Any]] = []
        self._series: list[dict[str, Any]] = []
        self._last_refresh_at: datetime | None = None
        self._last_error: str | None = None
        self._thread_started = False
        self.refresh()

    def _headers(self) -> dict[str, str]:
        if not self.settings.jellyfin_api_key:
            return {}
        return {"X-Emby-Token": self.settings.jellyfin_api_key}

    def _fetch_items(self, item_type: str, fields: str = "") -> list[dict[str, Any]]:
        if not self.settings.jellyfin_user_id or not self.settings.jellyfin_api_key:
            return []

        query = (
            f"{self.settings.jellyfin_url}/Users/{self.settings.jellyfin_user_id}/Items"
            f"?Recursive=true&IncludeItemTypes={item_type}"
        )
        if fields:
            query += f"&Fields={fields}"

        response = requests.get(query, headers=self._headers(), timeout=20)
        response.raise_for_status()
        return response.json().get("Items", [])

    def refresh(self) -> None:
        try:
            movies = self._fetch_items("Movie")
            series = self._fetch_items("Series", fields="ChildCount,Overview")

            with self._lock:
                self._movies = movies
                self._series = series
                self._last_refresh_at = datetime.now(timezone.utc)
                self._last_error = None
        except Exception as exc:
            with self._lock:
                self._last_error = str(exc)

    def start_background_refresh(self) -> None:
        if self._thread_started:
            return

        def _loop() -> None:
            while True:
                time.sleep(self.settings.cache_refresh_interval_seconds)
                self.refresh()

        self._thread_started = True
        threading.Thread(target=_loop, name="jellyfin-refresh", daemon=True).start()

    def _summarize_items(self, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "id": item.get("Id"),
                "name": item.get("Name"),
                "type": item.get("Type"),
                "year": item.get("ProductionYear"),
                "overview": item.get("Overview"),
                "localSeasons": item.get("ChildCount"),
            }
            for item in items
        ]

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "movies": list(self._movies),
                "series": list(self._series),
                "lastRefreshAt": self._last_refresh_at.isoformat() if self._last_refresh_at else None,
                "lastError": self._last_error,
            }

    def get_overview(self) -> dict[str, Any]:
        snapshot = self.snapshot()
        movies = self._summarize_items(snapshot["movies"])
        series = self._summarize_items(snapshot["series"])
        is_configured = bool(self.settings.jellyfin_api_key and self.settings.jellyfin_user_id)
        return {
            "stats": {
                "movies": len(movies),
                "series": len(series),
                "totalItems": len(movies) + len(series),
            },
            "movies": {
                "count": len(movies),
                "items": movies[:8],
            },
            "series": {
                "count": len(series),
                "items": series[:8],
            },
            "sync": {
                "lastRefreshAt": snapshot["lastRefreshAt"],
                "isConnected": is_configured and snapshot["lastError"] is None,
                "lastError": snapshot["lastError"],
            },
            "capabilities": {
                "jellyfinConfigured": is_configured,
                "tmdbConfigured": bool(self.settings.tmdb_api_key),
                "assistantConfigured": bool(self.settings.genai_api_key),
            },
        }

    def get_series_items(self) -> list[dict[str, Any]]:
        return self._summarize_items(self.snapshot()["series"])

    def health_snapshot(self) -> dict[str, Any]:
        snapshot = self.snapshot()
        return {
            "configured": bool(self.settings.jellyfin_api_key and self.settings.jellyfin_user_id),
            "lastRefreshAt": snapshot["lastRefreshAt"],
            "lastError": snapshot["lastError"],
            "movieCount": len(snapshot["movies"]),
            "seriesCount": len(snapshot["series"]),
        }
