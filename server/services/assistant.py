from __future__ import annotations

import json
import re
import unicodedata
from typing import Any

from server.config import Settings
from server.services.audit import TmdbAuditService
from server.services.imdb import ImdbMetadataService
from server.services.jellyfin import JellyfinLibraryService
from server.services.memory_service import MemoryService

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
        imdb_service: ImdbMetadataService,
        memory_service: MemoryService | None = None,
    ):
        self.settings = settings
        self.library_service = library_service
        self.audit_service = audit_service
        self.imdb_service = imdb_service
        self.memory_service = memory_service or MemoryService()
        self._configured = bool(settings.genai_api_key and genai is not None)
        self._client = genai.Client(api_key=settings.genai_api_key) if self._configured else None

    def health_snapshot(self) -> dict[str, Any]:
        return {
            "configured": self._configured,
            "defaultModel": self.settings.default_model,
            "imdbConfigured": self.imdb_service.health_snapshot().get("configured", False),
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
        prompt_context = self.library_service.get_prompt_context(message)
        audit = (
            self.audit_service.get_summary(self.library_service.get_series_items())
            if self._message_requires_audit(message)
            else self.audit_service.peek_summary()
        )

        local_response = self._local_response(
            message=message,
            history=history,
            overview=overview,
            audit=audit,
            files=files,
            pasted_content=pasted_content,
        )

        recommended_items: list[dict[str, Any]] = []
        if local_response is not None:
            response_text = local_response["text"]
            recommended_items = local_response["items"]
        elif self._configured and model != "context-only":
            response_text = self._generate_with_model(
                message=message,
                history=history,
                model=model,
                is_thinking_enabled=is_thinking_enabled,
                files=files,
                pasted_content=pasted_content,
                overview=overview,
                prompt_context=prompt_context,
                audit=audit,
            )
            recommended_items = self._extract_library_recommendations_from_text(response_text)
        else:
            response_text = self._unavailable_model_response(message=message, overview=overview)
            recommended_items = self._extract_library_recommendations_from_text(response_text)

        recommendations = self._build_recommendations(items=recommended_items, user_message=message)

        return {
            "response": response_text,
            "model": model,
            "echo": {
                "fileCount": len(files),
                "pastedCount": len(pasted_content),
                "thinking": is_thinking_enabled,
            },
            "recommendations": recommendations,
        }

    def _normalize_text(self, text: str) -> str:
        normalized = unicodedata.normalize("NFKD", text.lower())
        return "".join(char for char in normalized if not unicodedata.combining(char)).strip()

    def _message_requires_audit(self, message: str) -> bool:
        normalized = self._normalize_text(message)
        keywords = (
            "temporada",
            "temporadas",
            "al dia",
            "desactual",
            "desactualizada",
            "desactualizadas",
            "falta",
            "faltan",
            "tmdb",
        )
        return any(keyword in normalized for keyword in keywords)

    def _extract_requested_count(self, message: str, default: int = 5) -> int:
        match = re.search(r"\b(\d{1,2})\b", message)
        if not match:
            return default
        return max(1, min(int(match.group(1)), 20))

    def _detect_media_type(self, message: str) -> str | None:
        normalized = self._normalize_text(message)
        if any(token in normalized for token in ("peli", "pelis", "pelicula", "peliculas", "film")):
            return "movie"
        if any(token in normalized for token in ("serie", "series")):
            return "series"
        return None

    def _infer_media_type_from_history(self, history: list[dict[str, Any]]) -> str | None:
        for entry in reversed(history):
            if entry.get("role") != "user":
                continue
            inferred_media_type = self._detect_media_type(str(entry.get("content", "")))
            if inferred_media_type:
                return inferred_media_type
        return None

    def _infer_genres_from_history(self, history: list[dict[str, Any]]) -> list[str]:
        for entry in reversed(history):
            if entry.get("role") != "user":
                continue
            inferred_genres = self.library_service.detect_genres_in_query(str(entry.get("content", "")))
            if inferred_genres:
                return inferred_genres
        return []

    def _looks_like_follow_up(self, message: str) -> bool:
        normalized = self._normalize_text(message)
        return any(token in normalized for token in ("otra", "otro", "mas", "alguna mas"))

    def _extract_recent_suggestions(self, history: list[dict[str, Any]]) -> set[str]:
        suggested_titles: set[str] = set()
        for entry in history[-6:]:
            if entry.get("role") != "assistant":
                continue
            for line in str(entry.get("content", "")).splitlines():
                stripped = line.strip()
                if not stripped.startswith("- "):
                    continue
                title = stripped[2:].split(" (", 1)[0].split(" · ", 1)[0].strip()
                if title:
                    suggested_titles.add(title.casefold())
        return suggested_titles

    def _format_catalog_items(
        self, items: list[dict[str, Any]], media_type: str, genre: str, requested_count: int
    ) -> str:
        media_label = "peliculas" if media_type == "movie" else "series"
        text = f"Aqui tienes {len(items)} {media_label} de {genre} en tu biblioteca."
        if len(items) < requested_count:
            text += f" No he encontrado mas de {len(items)} coincidencias claras para ese genero."
        return text

    def _library_query_response(
        self, *, message: str, history: list[dict[str, Any]]
    ) -> dict[str, Any] | None:
        media_type = self._detect_media_type(message) or self._infer_media_type_from_history(history)
        genres = self.library_service.detect_genres_in_query(message) or self._infer_genres_from_history(history)
        if not media_type or not genres:
            return None

        default_count = 1 if self._looks_like_follow_up(message) else 5
        requested_count = self._extract_requested_count(message, default=default_count)
        genre = genres[0]
        items = self.library_service.find_items_by_genre(
            media_type=media_type,
            genre=genre,
            limit=max(requested_count + 5, 10),
        )

        recent_suggestions = self._extract_recent_suggestions(history)
        if recent_suggestions:
            items = [item for item in items if (item.get("name") or "").casefold() not in recent_suggestions]
        items = items[:requested_count]

        if not items:
            media_label = "peliculas" if media_type == "movie" else "series"
            return {
                "text": f"No he encontrado {media_label} del genero solicitado en la biblioteca.",
                "items": [],
            }

        return {
            "text": self._format_catalog_items(items, media_type, genre, requested_count),
            "items": items,
        }

    def _is_top_rated_query(self, message: str) -> bool:
        normalized = self._normalize_text(message)
        patterns = (
            "mejor valorada",
            "mejor valorado",
            "mas valorada",
            "mas valorado",
            "mejor puntuada",
            "mejor puntuado",
            "con mejor nota",
            "top",
        )
        return any(pattern in normalized for pattern in patterns)

    def _top_rated_response(
        self, *, message: str, history: list[dict[str, Any]]
    ) -> dict[str, Any] | None:
        if not self._is_top_rated_query(message):
            return None

        media_type = self._detect_media_type(message) or self._infer_media_type_from_history(history)
        if not media_type:
            return None

        requested_count = self._extract_requested_count(message, default=1)
        genre = None
        detected_genres = self.library_service.detect_genres_in_query(message) or self._infer_genres_from_history(history)
        if detected_genres:
            genre = detected_genres[0]

        exclude_titles = self._extract_recent_suggestions(history) if self._looks_like_follow_up(message) else None
        items = self.library_service.find_top_rated_items(
            media_type=media_type,
            limit=requested_count,
            genre=genre,
            exclude_titles=exclude_titles,
        )

        if not items:
            media_label = "peliculas" if media_type == "movie" else "series"
            if genre:
                return {
                    "text": f"No he encontrado {media_label} del genero {genre} con valoracion disponible.",
                    "items": [],
                }
            return {
                "text": f"No he encontrado {media_label} con valoracion disponible en la biblioteca.",
                "items": [],
            }

        media_label = "pelicula" if media_type == "movie" and requested_count == 1 else "peliculas"
        if media_type == "series":
            media_label = "serie" if requested_count == 1 else "series"

        scope = f" de {genre}" if genre else ""
        if requested_count == 1:
            item = items[0]
            year = f" ({item['year']})" if item.get("year") else ""
            rating = f"{item['communityRating']:.1f}/10" if item.get("communityRating") else "sin nota"
            return {
                "text": f"La {media_label} mejor valorada{scope} de tu biblioteca es {item['name']}{year} con {rating}.",
                "items": items,
            }

        return {
            "text": f"Aqui tienes las {len(items)} {media_label} mejor valoradas{scope} de tu biblioteca.",
            "items": items,
        }

    def _stats_response(self, message: str, overview: dict[str, Any]) -> dict[str, Any] | None:
        normalized = self._normalize_text(message)
        stats = overview["stats"]

        if "cuantas" not in normalized and "cuantos" not in normalized:
            return None
        if "peli" in normalized or "pelicula" in normalized:
            return {"text": f"Tienes {stats['movies']} peliculas en la biblioteca.", "items": []}
        if "serie" in normalized:
            return {"text": f"Tienes {stats['series']} series en la biblioteca.", "items": []}
        if any(token in normalized for token in ("total", "elementos", "titulos", "contenido")):
            return {
                "text": f"Tienes {stats['totalItems']} titulos en total: {stats['movies']} peliculas y {stats['series']} series.",
                "items": [],
            }
        return None

    def _audit_response(
        self, message: str, audit: dict[str, Any], overview: dict[str, Any]
    ) -> dict[str, Any] | None:
        if not self._message_requires_audit(message):
            return None

        stats = overview["stats"]
        if audit["configured"]:
            if audit["count"] == 0:
                return {
                    "text": (
                        "La auditoria no detecta series desactualizadas. "
                        f"Tienes {stats['series']} series indexadas y no hay diferencias pendientes en la muestra auditada."
                    ),
                    "items": [],
                }

            lines = [f"He encontrado {audit['count']} series con temporadas potencialmente pendientes:"]
            for item in audit["items"]:
                lines.append(
                    f"- {item['name']}: locales {item['localSeasons']}, TMDB {item['remoteSeasons']} "
                    f"(faltan {item['missingSeasons']})"
                )
            return {"text": "\n".join(lines), "items": []}

        return {
            "text": "La auditoria de TMDB no esta configurada. Anade `TMDB_API_KEY` para comparar temporadas remotas.",
            "items": [],
        }

    def _local_response(
        self,
        *,
        message: str,
        history: list[dict[str, Any]],
        overview: dict[str, Any],
        audit: dict[str, Any],
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        library_response = self._library_query_response(message=message, history=history)
        if library_response is not None:
            return library_response

        top_rated_response = self._top_rated_response(message=message, history=history)
        if top_rated_response is not None:
            return top_rated_response

        stats_response = self._stats_response(message, overview)
        if stats_response is not None:
            return stats_response

        audit_response = self._audit_response(message, audit, overview)
        if audit_response is not None:
            return audit_response

        return None

    def _extract_library_recommendations_from_text(self, text: str) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        seen = set()
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line.startswith("- "):
                continue
            candidate = line[2:]
            candidate = candidate.split(" (", 1)[0]
            candidate = candidate.split(" · ", 1)[0]
            candidate = re.sub(r"[:;,.]+$", "", candidate).strip()
            if not candidate:
                continue
            item = self.library_service.find_item_by_title(candidate)
            if not item:
                continue
            dedupe_key = str(item.get("id") or item.get("name") or "").casefold()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            items.append(item)
            if len(items) >= 6:
                break
        return items

    def _recommendation_reason_from_query(self, user_message: str) -> str:
        normalized = self._normalize_text(user_message)
        if "terror" in normalized or "horror" in normalized:
            return "Encaja con el tono de terror que has pedido."
        if "comedia" in normalized:
            return "Es una opcion solida para una sesion de comedia."
        if "top" in normalized or "mejor" in normalized:
            return "Destaca por su valoracion dentro de tu biblioteca."
        return "Buena opcion basada en tu consulta actual."

    def _build_recommendations(
        self, *, items: list[dict[str, Any]], user_message: str
    ) -> list[dict[str, Any]]:
        if not items:
            return []

        reason = self._recommendation_reason_from_query(user_message)
        payload: list[dict[str, Any]] = []
        seen = set()
        for item in items:
            dedupe_key = str(item.get("id") or item.get("name") or "").casefold()
            if not dedupe_key or dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            imdb = self.imdb_service.enrich_item(item)
            playback_url = item.get("playbackUrl")
            available = bool(playback_url and item.get("id"))

            payload.append(
                {
                    "title": item.get("name"),
                    "type": "Serie"
                    if str(item.get("type", "")).lower().startswith("series")
                    else "Pelicula",
                    "year": imdb.get("year") or item.get("year"),
                    "genres": imdb.get("genres") or item.get("genres") or [],
                    "runtimeMinutes": imdb.get("runtimeMinutes") or item.get("runtimeMinutes"),
                    "rating": imdb.get("imdbRating") or item.get("communityRating"),
                    "posterUrl": imdb.get("posterUrl") or item.get("imageUrl"),
                    "description": imdb.get("plot") or item.get("overview"),
                    "reason": reason,
                    "jellyfin": {
                        "available": available,
                        "playUrl": playback_url if available else None,
                        "statusMessage": (
                            "Disponible en Jellyfin, puedes abrirla ya."
                            if available
                            else "No disponible ahora en Jellyfin. Puedes pedir una alternativa similar."
                        ),
                    },
                }
            )
            if len(payload) >= 6:
                break
        return payload

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
        prompt_context: dict[str, Any],
        audit: dict[str, Any],
    ) -> str:
        prompt = self._build_prompt(
            message=message,
            history=history,
            is_thinking_enabled=is_thinking_enabled,
            files=files,
            pasted_content=pasted_content,
            overview=overview,
            prompt_context=prompt_context,
            audit=audit,
        )

        try:
            reply = self._client.models.generate_content(model=model, contents=prompt)
            return (reply.text or "").strip() or "No pude generar una respuesta util."
        except Exception as exc:
            local_response = self._local_response(
                message=message,
                history=history,
                overview=overview,
                audit=audit,
                files=files,
                pasted_content=pasted_content,
            )
            if local_response is not None:
                return local_response["text"]

            if "RESOURCE_EXHAUSTED" in str(exc) or "429" in str(exc):
                return self._quota_exhausted_response(overview=overview, audit=audit)
            return self._unavailable_model_response(message=message, overview=overview)

    def _build_prompt(
        self,
        *,
        message: str,
        history: list[dict[str, Any]],
        is_thinking_enabled: bool,
        files: list[dict[str, Any]],
        pasted_content: list[dict[str, Any]],
        overview: dict[str, Any],
        prompt_context: dict[str, Any],
        audit: dict[str, Any],
    ) -> str:
        trimmed_history = history[-8:]
        memory_context = self.memory_service.get_context()
        memory_section = (
            f"\nMEMORIA DE SESIONES ANTERIORES:\n{memory_context}\n"
            if memory_context
            else ""
        )
        return f"""
Eres un asistente especializado exclusivamente en la biblioteca multimedia Jellyfin del usuario.
Tu unico ambito es el contenido disponible en ese servidor: peliculas, series, temporadas, generos, valoraciones y estado de la coleccion.
Responde siempre en espanol, con tono profesional, conciso y directo.
{memory_section}
AMBITO Y RESTRICCIONES:
- Responde unicamente sobre el contenido del servidor Jellyfin. Si el usuario pregunta algo ajeno a la biblioteca (noticias, recetas, codigo, cultura general, etc.), responde: "Solo puedo ayudarte con el contenido de tu servidor Jellyfin."
- No inventes titulos, anos, generos, temporadas, duraciones, valoraciones ni ningun metadato. Usa exclusivamente los datos del contexto proporcionado.
- No hagas suposiciones ni rellenes huecos de informacion que no aparezcan en el contexto.

FORMATO DE RESPUESTA (obligatorio, sin excepciones):
1. Si el usuario pide recomendaciones o una lista de titulos:
   - Escribe primero la lista, un titulo por linea, con el formato exacto: "- Titulo (Año)"
   - Ejemplo: "- Oppenheimer (2023)"
   - Tras la lista puedes anadir un breve parrafo de contexto (maximo 2 frases). Nunca al reves.
2. Si el usuario pide estadisticas o estado de la biblioteca, responde con un unico parrafo claro y sin listas.
3. Si el usuario pide informacion sobre series desactualizadas o temporadas faltantes, usa la auditoria TMDB si esta disponible y presenta los resultados en lista con el formato: "- NombreSerie: X temporadas locales / Y en TMDB (faltan Z)"
4. Si no hay resultados para la consulta, indica claramente que no se ha encontrado contenido y sugiere ampliar o cambiar los criterios.
5. {'Desarrolla la respuesta con razonamiento detallado cuando sea util.' if is_thinking_enabled else 'Respuestas directas y accionables, sin rodeos.'}

ATENCION A LA PETICION DEL USUARIO:
- Lee con atencion lo que pide el usuario: numero de titulos solicitados, genero, tipo de contenido y cualquier filtro adicional.
- Si pide 5 peliculas de terror, devuelve exactamente 5 peliculas de terror disponibles en la biblioteca, ni mas ni menos.
- Si el usuario especifica un criterio (mejor valoradas, mas recientes, de un ano concreto), aplica ese criterio con precision.
- Si el usuario hace un seguimiento de una consulta anterior, ten en cuenta el historial para no repetir sugerencias ya mostradas.

RESUMEN DE LA BIBLIOTECA:
{json.dumps(overview, ensure_ascii=False, indent=2)}

CONTEXTO RELEVANTE DE JELLYFIN:
{json.dumps(prompt_context, ensure_ascii=False, indent=2)}

AUDITORIA TMDB:
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

    def _unavailable_model_response(self, *, message: str, overview: dict[str, Any]) -> str:
        stats = overview["stats"]
        return (
            "No he podido resolver esa peticion solo con la logica local actual. "
            f"La biblioteca tiene {stats['movies']} peliculas y {stats['series']} series. "
            "Necesito el modelo generativo disponible para responder bien a esa consulta."
        )

    def _quota_exhausted_response(self, *, overview: dict[str, Any], audit: dict[str, Any]) -> str:
        stats = overview["stats"]
        if audit.get("configured") and audit.get("count"):
            first = audit["items"][0]
            return (
                "Gemini ha superado la cuota temporal y he pasado a modo degradado.\n"
                f"Tu biblioteca tiene {stats['movies']} peliculas y {stats['series']} series.\n"
                f"Ahora mismo si puedo confirmarte al menos una discrepancia detectada por TMDB: "
                f"{first['name']} (local {first['localSeasons']}, TMDB {first['remoteSeasons']}). "
                "Espera un minuto o reduce la frecuencia de consultas para volver al modo completo."
            )

        return (
            "Gemini ha superado la cuota temporal y he pasado a modo degradado.\n"
            f"Tu biblioteca tiene {stats['movies']} peliculas y {stats['series']} series. "
            "Espera un minuto o reduce la frecuencia de consultas para volver al modo completo."
        )
