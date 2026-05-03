import logging
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_session import Session

from .config import Settings
from .routes import api
from .services.assistant import AssistantService
from .services.audit import TmdbAuditService
from .services.imdb import ImdbMetadataService
from .services.jellyfin import JellyfinLibraryService
from .services.memory_service import MemoryService
from .services.tmdb_image import TmdbImageService

logger = logging.getLogger(__name__)


def create_app() -> Flask:
    settings = Settings.from_env()

    _warn_if_internal_url(settings.jellyfin_public_url)
    app = Flask(__name__, static_folder=None)

    session_dir = Path(".flask_session")
    session_dir.mkdir(exist_ok=True)

    app.config.update(
        SECRET_KEY=settings.secret_key,
        SESSION_TYPE="filesystem",
        SESSION_FILE_DIR=str(session_dir),
        SESSION_PERMANENT=False,
        PORT=settings.port,
    )

    Session(app)

    tmdb_image_service = TmdbImageService(settings)
    library_service = JellyfinLibraryService(settings, tmdb_image_service)
    audit_service = TmdbAuditService(settings)
    imdb_service = ImdbMetadataService(settings)
    memory_service = MemoryService()
    assistant_service = AssistantService(
        settings,
        library_service,
        audit_service,
        imdb_service,
        memory_service,
        tmdb_image_service,
    )

    library_service.start_background_refresh()

    app.extensions["settings"] = settings
    app.extensions["library_service"] = library_service
    app.extensions["audit_service"] = audit_service
    app.extensions["memory_service"] = memory_service
    app.extensions["assistant_service"] = assistant_service
    app.extensions["imdb_service"] = imdb_service

    app.register_blueprint(api, url_prefix="/api")

    @app.get("/health")
    def health_redirect():
        return jsonify({"status": "ok"})

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def serve_spa(path: str):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404

        dist_dir = settings.dist_dir
        requested = dist_dir / path

        if path and requested.exists() and requested.is_file():
            return send_from_directory(dist_dir, path)

        index_file = dist_dir / "index.html"
        if index_file.exists():
            return send_from_directory(dist_dir, "index.html")

        return (
            jsonify(
                {
                    "status": "frontend_not_built",
                    "message": "The frontend build was not found. Run `npm run build` to generate dist/.",
                }
            ),
            503,
        )

    return app


def _warn_if_internal_url(public_url: str) -> None:
    import re
    internal_patterns = [
        r"^https?://10\.",
        r"^https?://192\.168\.",
        r"^https?://172\.(1[6-9]|2\d|3[01])\.",
        r"^https?://127\.",
        r"^https?://jellyfin(:\d+)?(/|$)",
    ]
    is_internal = any(re.match(p, public_url) for p in internal_patterns)
    level = logging.WARNING if is_internal else logging.INFO
    logger.log(level, "Jellyfin public URL: %s%s", public_url,
               " — ADVERTENCIA: parece una direccion interna. Configura JELLYFIN_PUBLIC_URL con tu dominio publico." if is_internal else "")
