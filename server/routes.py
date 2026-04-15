from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request, session


api = Blueprint("api", __name__)


def _services():
    return (
        current_app.extensions["assistant_service"],
        current_app.extensions["library_service"],
        current_app.extensions["audit_service"],
        current_app.extensions["settings"],
    )


@api.get("/health")
def health():
    assistant_service, library_service, audit_service, settings = _services()
    return jsonify(
        {
            "status": "ok",
            "appName": settings.app_name,
            "library": library_service.health_snapshot(),
            "audit": audit_service.health_snapshot(),
            "assistant": assistant_service.health_snapshot(),
        }
    )


@api.get("/library/overview")
def library_overview():
    _, library_service, audit_service, _ = _services()
    overview = library_service.get_overview()
    audit_summary = audit_service.peek_summary()
    overview["audit"] = audit_summary
    return jsonify(overview)


@api.post("/chat")
def chat():
    assistant_service, _, _, settings = _services()
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()

    if not message and not payload.get("files") and not payload.get("pastedContent"):
        return jsonify({"error": "Please provide a message or contextual attachments."}), 400

    history = session.get("history", [])
    response = assistant_service.respond(
        message=message,
        history=history,
        model=str(payload.get("model") or settings.default_model),
        is_thinking_enabled=bool(payload.get("isThinkingEnabled")),
        files=payload.get("files") or [],
        pasted_content=payload.get("pastedContent") or [],
    )

    history.extend(
        [
            {"role": "user", "content": message or "[contexto adjunto]", "meta": response["echo"]},
            {"role": "assistant", "content": response["response"]},
        ]
    )
    session["history"] = history[-settings.max_session_messages :]

    return jsonify(response)
