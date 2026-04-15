from __future__ import annotations

import json
from typing import Any

from server.config import Settings
from server.services.audit import TmdbAuditService
from server.services.jellyfin import JellyfinLibraryService

try:
    from google import genai
except Exception:  # pragma: no cover - graceful degradation when dependency is missing
    genai = None


class AssistantService:
    def __init__(
        self,
        settings: Settings,
        library_service: JellyfinLibraryService,
        audit_service: TmdbAuditService,
    ):
        self.settings = settings
        self.library_service = library_service
        self.audit_service = audit_service
        self._configured = bool(settings.genai_api_key and genai is not None)
        self._client = genai.Client(api_key=settings.genai_api_key) if self._configured else None

    def health_snapshot(self) -> dict[str, Any]:
        return {
            "configured": self._configured,
            "defaultModel": self.settings.default_model,
        }

    def respond(
        self,
        *,
        message: str,
        history: list[dict[str, Any]],
        model: str,
        is_thinking_enabled: bool,
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
    ) -> dict[str, Any]:
        overview = self.library_service.get_overview()
        library_context = self.library_service.get_library_context()
        audit = (
            self.audit_service.get_summary(self.library_service.get_series_items())
            if self._message_requires_audit(message)
            else self.audit_service.peek_summary()
        )

        if self._configured and model != "context-only":
            response_text = self._generate_with_model(
                message=message,
                history=history,
                model=model,
                is_thinking_enabled=is_thinking_enabled,
                files=files,
                pasted_content=pasted_content,
                overview=overview,
                library_context=library_context,
                audit=audit,
            )
        else:
            response_text = self._offline_response(
                message=message,
                files=files,
                pasted_content=pasted_content,
                overview=overview,
                audit=audit,
            )

        return {
            "response": response_text,
            "model": model,
            "echo": {
                "fileCount": len(files),
                "pastedCount": len(pasted_content),
                "thinking": is_thinking_enabled,
            },
        }

    def _message_requires_audit(self, message: str) -> bool:
        normalized = message.lower()
        keywords = ("temporada", "temporadas", "al día", "desactual", "falta", "faltan", "tmdb")
        return any(keyword in normalized for keyword in keywords)

    def _generate_with_model(
        self,
        *,
        message: str,
        history: list[dict[str, Any]],
        model: str,
        is_thinking_enabled: bool,
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
        overview: dict[str, Any],
        library_context: dict[str, Any],
        audit: dict[str, Any],
    ) -> str:
        prompt = self._build_prompt(
            message=message,
            history=history,
            is_thinking_enabled=is_thinking_enabled,
            files=files,
            pasted_content=pasted_content,
            overview=overview,
            library_context=library_context,
            audit=audit,
        )

        reply = self._client.models.generate_content(model=model, contents=prompt)
        return (reply.text or "").strip() or "No pude generar una respuesta útil."

    def _build_prompt(
        self,
        *,
        message: str,
        history: list[dict[str, Any]],
        is_thinking_enabled: bool,
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
        overview: dict[str, Any],
        library_context: dict[str, Any],
        audit: dict[str, Any],
    ) -> str:
        trimmed_history = history[-8:]
        return f"""
Eres un asistente premium para gestionar y consultar una biblioteca Jellyfin.
Responde siempre en español, con tono claro, útil y profesional.

REGLAS:
- Si el usuario pregunta por faltas de temporadas o series desactualizadas, usa la auditoría TMDB si está disponible.
- Si el usuario adjunta archivos o pega contenido, úsalo como contexto adicional.
- No inventes títulos, géneros, temporadas, duraciones, estados ni metadatos de la biblioteca.
- Si algo no está configurado, dilo con precisión y sugiere el siguiente paso útil.
- {'Prioriza respuestas más profundas y razonadas.' if is_thinking_enabled else 'Prioriza respuestas directas y accionables.'}

RESUMEN DE LA BIBLIOTECA:
{json.dumps(overview, ensure_ascii=False, indent=2)}

CATÁLOGO COMPLETO DE JELLYFIN:
{json.dumps(library_context, ensure_ascii=False, indent=2)}

AUDITORÍA TMDB:
{json.dumps(audit, ensure_ascii=False, indent=2)}

ARCHIVOS ADJUNTOS:
{json.dumps(files, ensure_ascii=False, indent=2)}

CONTENIDO PEGADO:
{json.dumps(pasted_content, ensure_ascii=False, indent=2)}

HISTORIAL RECIENTE:
{json.dumps(trimmed_history, ensure_ascii=False, indent=2)}

CONSULTA DEL USUARIO:
{message}
""".strip()

    def _offline_response(
        self,
        *,
        message: str,
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
        overview: dict[str, Any],
        audit: dict[str, Any],
    ) -> str:
        lower_message = message.lower()
        stats = overview["stats"]

        if any(word in lower_message for word in ("temporada", "series", "al día", "actualizada", "falta")):
            if audit["configured"]:
                if audit["count"] == 0:
                    return (
                        "La auditoría no detecta series desactualizadas. "
                        f"Tienes {stats['series']} series indexadas y no hay diferencias pendientes en la muestra auditada."
                    )

                lines = [
                    f"He encontrado {audit['count']} series con temporadas potencialmente pendientes:",
                ]
                for item in audit["items"]:
                    lines.append(
                        f"- {item['name']}: locales {item['localSeasons']}, TMDB {item['remoteSeasons']} "
                        f"(faltan {item['missingSeasons']})"
                    )
                return "\n".join(lines)

            return (
                "Puedo ayudarte con la biblioteca local, pero la auditoría de TMDB no está configurada. "
                "Añade `TMDB_API_KEY` para comparar temporadas remotas."
            )

        attachment_note = ""
        if files or pasted_content:
            attachment_note = (
                f"\nHe recibido {len(files)} archivo(s) y {len(pasted_content)} bloque(s) de texto pegado como contexto adicional."
            )

        return (
            f"Tu biblioteca tiene {stats['movies']} películas y {stats['series']} series.{attachment_note}\n"
            "El modelo generativo no está configurado, así que ahora mismo respondo en modo asistido local. "
            "Si quieres respuestas más ricas sobre la biblioteca, configura `GENAI_API_KEY`."
        )
