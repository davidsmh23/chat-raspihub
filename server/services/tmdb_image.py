from __future__ import annotations

from typing import Any

import requests

from server.config import Settings


class TmdbImageService:
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE = "https://image.tmdb.org/t/p"

    def __init__(self, settings: Settings):
        self.settings = settings
        self._cache: dict[str, str | None] = {}

    def get_poster_url(
        self,
        tmdb_id: str | int,
        media_type: str,
        size: str = "w342",
    ) -> str | None:
        if not self.settings.tmdb_api_key or not tmdb_id:
            return None

        cache_key = f"{media_type}:{tmdb_id}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        endpoint = "tv" if str(media_type).lower() in ("series", "tv") else "movie"

        try:
            response = requests.get(
                f"{self.BASE_URL}/{endpoint}/{tmdb_id}",
                params={"api_key": self.settings.tmdb_api_key},
                timeout=8,
            )
            response.raise_for_status()
            poster_path = response.json().get("poster_path")
            result = f"{self.IMAGE_BASE}/{size}{poster_path}" if poster_path else None
        except Exception:
            result = None

        self._cache[cache_key] = result
        return result

    def health_snapshot(self) -> dict[str, Any]:
        return {"configured": bool(self.settings.tmdb_api_key)}
