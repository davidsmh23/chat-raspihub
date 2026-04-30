from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str
    secret_key: str
    port: int
    dist_dir: Path
    genai_api_key: str | None
    default_model: str
    jellyfin_url: str
    jellyfin_public_url: str
    jellyfin_api_key: str | None
    jellyfin_user_id: str | None
    tmdb_api_key: str | None
    omdb_api_key: str | None
    cache_refresh_interval_seconds: int
    tmdb_audit_ttl_seconds: int
    max_session_messages: int

    @classmethod
    def from_env(cls) -> "Settings":
        root_dir = Path(__file__).resolve().parent.parent
        return cls(
            app_name=os.getenv("APP_NAME", "RaspiHub AI"),
            secret_key=os.getenv("FLASK_SECRET_KEY", "change-me-in-production"),
            port=int(os.getenv("PORT", "3752")),
            dist_dir=root_dir / "dist",
            genai_api_key=os.getenv("GENAI_API_KEY"),
            default_model=os.getenv("GENAI_DEFAULT_MODEL", "gemini-2.5-flash"),
            jellyfin_url=os.getenv("JELLYFIN_URL", "http://jellyfin:8096").rstrip("/"),
            jellyfin_public_url=os.getenv(
                "JELLYFIN_PUBLIC_URL",
                os.getenv("JELLYFIN_URL", "http://jellyfin:8096"),
            ).rstrip("/"),
            jellyfin_api_key=os.getenv("JELLYFIN_API_KEY"),
            jellyfin_user_id=os.getenv("JELLYFIN_USER_ID"),
            tmdb_api_key=os.getenv("TMDB_API_KEY"),
            omdb_api_key=os.getenv("OMDB_API_KEY"),
            cache_refresh_interval_seconds=int(os.getenv("CACHE_REFRESH_INTERVAL_SECONDS", "3600")),
            tmdb_audit_ttl_seconds=int(os.getenv("TMDB_AUDIT_TTL_SECONDS", "21600")),
            max_session_messages=int(os.getenv("MAX_SESSION_MESSAGES", "12")),
        )
