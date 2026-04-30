from __future__ import annotations

from typing import Any

import requests

from server.config import Settings


class ImdbMetadataService:
    OMDB_BASE_URL = "https://www.omdbapi.com/"

    def __init__(self, settings: Settings):
        self.settings = settings
        self._configured = bool(settings.omdb_api_key)
        self._cache: dict[str, dict[str, Any]] = {}

    def health_snapshot(self) -> dict[str, Any]:
        return {"configured": self._configured}

    def enrich_item(self, item: dict[str, Any]) -> dict[str, Any]:
        base_metadata = {
            "posterUrl": None,
            "plot": item.get("overview"),
            "year": item.get("year"),
            "genres": item.get("genres") or [],
            "runtimeMinutes": item.get("runtimeMinutes"),
            "imdbRating": item.get("communityRating"),
            "imdbId": (item.get("providerIds") or {}).get("Imdb"),
        }

        if not self._configured:
            return base_metadata

        imdb_id = base_metadata["imdbId"]
        title = item.get("name")
        year = item.get("year")
        if not imdb_id and not title:
            return base_metadata

        cache_key = f"{imdb_id or ''}|{title or ''}|{year or ''}"
        if cache_key in self._cache:
            return {**base_metadata, **self._cache[cache_key]}

        query = {
            "apikey": self.settings.omdb_api_key or "",
            "plot": "short",
        }
        if imdb_id:
            query["i"] = imdb_id
        else:
            query["t"] = str(title)
            if year:
                query["y"] = str(year)

        try:
            response = requests.get(self.OMDB_BASE_URL, params=query, timeout=8)
            response.raise_for_status()
            payload = response.json()
            if payload.get("Response") != "True":
                return base_metadata

            runtime_raw = str(payload.get("Runtime") or "").strip()
            runtime_minutes = base_metadata["runtimeMinutes"]
            if runtime_raw.endswith(" min"):
                runtime_value = runtime_raw.replace(" min", "").strip()
                if runtime_value.isdigit():
                    runtime_minutes = int(runtime_value)

            enriched = {
                "posterUrl": payload.get("Poster")
                if payload.get("Poster") and payload.get("Poster") != "N/A"
                else None,
                "plot": payload.get("Plot")
                if payload.get("Plot") and payload.get("Plot") != "N/A"
                else base_metadata["plot"],
                "year": int(payload.get("Year"))
                if str(payload.get("Year", "")).isdigit()
                else base_metadata["year"],
                "genres": [
                    part.strip()
                    for part in str(payload.get("Genre", "")).split(",")
                    if part.strip()
                ]
                or base_metadata["genres"],
                "runtimeMinutes": runtime_minutes,
                "imdbRating": float(payload.get("imdbRating"))
                if str(payload.get("imdbRating", "")).replace(".", "", 1).isdigit()
                else base_metadata["imdbRating"],
                "imdbId": payload.get("imdbID") or base_metadata["imdbId"],
            }
            self._cache[cache_key] = enriched
            return {**base_metadata, **enriched}
        except Exception:
            return base_metadata
