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


def create_app() -> Flask:
    settings = Settings.from_env()
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

    library_service = JellyfinLibraryService(settings)
    audit_service = TmdbAuditService(settings)
    imdb_service = ImdbMetadataService(settings)
    memory_service = MemoryService()
    assistant_service = AssistantService(
        settings,
        library_service,
        audit_service,
        imdb_service,
        memory_service,
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
