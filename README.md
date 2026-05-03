# Jellyfin AI Chat

[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-davidsmh233%2Fjellyfin--ai--chat-blue?logo=docker)](https://hub.docker.com/repository/docker/davidsmh233/jellyfin-ai-chat/general)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Asistente conversacional para tu biblioteca Jellyfin. Consulta películas y series, obtén recomendaciones por género, revisa auditorías de temporadas faltantes y explora tu colección mediante lenguaje natural, con tarjetas enriquecidas con posters, valoraciones y enlace directo a Jellyfin.

---

## Características

- **Chat con IA** — Respuestas contextuales basadas en tu biblioteca real (Gemini)
- **Recomendaciones enriquecidas** — Tarjetas con poster (TMDB), valoración, género y enlace directo a Jellyfin
- **Auditoría de series** — Detecta temporadas faltantes comparando tu biblioteca con TMDB
- **Caché de biblioteca** — Sincronización periódica con Jellyfin, sin peticiones en cada mensaje
- **Modo oscuro/claro** — Interfaz adaptable con animaciones y efectos visuales
- **Multi-arquitectura** — Imagen Docker para `linux/amd64` y `linux/arm64`

---

## Arquitectura

```
jellyfin-ai-chat/
├── server/                     # Backend Flask (API)
│   ├── __init__.py             # Factory: create_app()
│   ├── config.py               # Settings (dataclass, env vars)
│   ├── routes.py               # Blueprint /api/*
│   └── services/
│       ├── assistant.py        # Orquestador IA + extracción de recomendaciones
│       ├── jellyfin.py         # Caché y consultas a la API de Jellyfin
│       ├── audit.py            # Auditoría TMDB vs biblioteca local
│       ├── imdb.py             # Metadatos complementarios
│       ├── tmdb_image.py       # URLs de posters y backdrops
│       └── memory_service.py   # Contexto de sesión
├── src/                        # Frontend React + TypeScript (Vite)
│   ├── components/
│   │   ├── chat/               # ChatPanel, MovieCard, mensajes
│   │   ├── media/              # MediaCard, MediaGrid, BackdropCarousel
│   │   ├── layout/             # AppHeader, AppSidebar
│   │   └── ui/                 # Componentes base reutilizables
│   ├── hooks/                  # use-chat, use-library-overview
│   ├── contexts/               # ThemeContext, MediaHighlightContext
│   └── types/api.ts            # Tipos TypeScript de la API
├── deploy/
│   ├── nginx/                  # Configuración de reverse proxy
│   └── systemd/                # Servicio para despliegue bare-metal
├── dockerfile                  # Multi-stage: build frontend + runtime Python
├── docker-compose.yaml         # Despliegue local / Swarm básico
├── cloud-chat-ia.yaml          # Stack para Docker Swarm en nube
└── gunicorn.conf.py            # Configuración del servidor WSGI
```

**Flujo de una petición de chat:**

```
Usuario → React (use-chat.ts)
       → POST /api/chat
       → AssistantService.respond()
       → [local] JellyfinLibraryService (caché en memoria)
       → [si necesario] Gemini API
       → _extract_library_recommendations_from_text()
       → _build_recommendations() → playUrl desde JELLYFIN_PUBLIC_URL
       → JSON { response, recommendations[] }
       → MovieCard con poster, valoración y enlace a Jellyfin
```

---

## Requisitos

| Servicio | Requerido | Notas |
|---|---|---|
| Jellyfin | Sí | Con API Key y User ID |
| Gemini API Key | Sí | `GENAI_API_KEY` de Google AI Studio |
| TMDB API Key | Opcional | Para auditoría de temporadas y posters |
| OMDB API Key | Opcional | Para metadatos adicionales |

---

## Configuración

Copia `.env.example` a `.env` y completa los valores:

```env
# Flask
FLASK_SECRET_KEY=cambia-esto-en-produccion
PORT=3752

# IA (Google Gemini)
GENAI_API_KEY=tu-api-key
GENAI_DEFAULT_MODEL=gemini-2.5-flash

# Jellyfin
# JELLYFIN_URL: URL para llamadas internas a la API de Jellyfin
# JELLYFIN_PUBLIC_URL: URL que aparece en los enlaces del chat (visible por el usuario)
JELLYFIN_URL=https://tu-jellyfin.ejemplo.com
JELLYFIN_PUBLIC_URL=https://tu-jellyfin.ejemplo.com
JELLYFIN_API_KEY=tu-api-key-de-jellyfin
JELLYFIN_USER_ID=tu-user-id-de-jellyfin

# Metadata (opcionales)
TMDB_API_KEY=
OMDB_API_KEY=

# Caché y sesión
CACHE_REFRESH_INTERVAL_SECONDS=3600
TMDB_AUDIT_TTL_SECONDS=21600
MAX_SESSION_MESSAGES=12
```

> **`JELLYFIN_URL` vs `JELLYFIN_PUBLIC_URL`**
> Si el contenedor accede a Jellyfin por IP interna (ej. `http://10.0.0.1:8096`) pero quieres que los enlaces del chat usen tu dominio público, define ambas variables con valores distintos. Si ambos accesos usan el mismo dominio, ponlas iguales.

---

## Inicio rápido con Docker

### Opción A — `docker compose` (local / desarrollo)

```bash
git clone https://github.com/davidsmh23/jellyfin-ai-chat.git
cd jellyfin-ai-chat
cp .env.example .env   # edita con tus valores
docker compose up -d --build
```

La app queda disponible en `http://localhost:3752`.

### Opción B — imagen publicada en Docker Hub

```bash
docker run -d \
  --name jellyfin-ai-chat \
  --env-file .env \
  -p 3752:3752 \
  davidsmh233/jellyfin-ai-chat:latest
```

### Opción C — Docker Swarm (producción en nube)

```bash
# Despliegue inicial del stack
docker stack deploy -c cloud-chat-ia.yaml gcp --with-registry-auth

# Actualizar imagen tras nuevo build
docker buildx build \
  --no-cache \
  --platform linux/amd64,linux/arm64 \
  -t davidsmh233/jellyfin-ai-chat:X.Y.Z \
  -t davidsmh233/jellyfin-ai-chat:latest \
  --push .

docker service update --image davidsmh233/jellyfin-ai-chat:X.Y.Z gcp_chat-ia
```

> **Importante con Swarm:** `docker service update --image` **solo actualiza la imagen**, no relee el `.env`. Para aplicar cambios de variables de entorno:
> ```bash
> docker service update \
>   --env-add VARIABLE=nuevo_valor \
>   gcp_chat-ia
> ```
> O redesplegar el stack completo con `docker stack deploy` (relee el `.env`).

---

## Desarrollo local

```bash
# Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py          # escucha en :3752

# Frontend (en otra terminal)
npm install
npm run dev            # escucha en :5173 con proxy a :3752
```

El proxy de Vite (`/api → http://127.0.0.1:3752`) permite trabajar con hot reload sin CORS.

---

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor |
| `GET` | `/api/library/overview` | Resumen de la biblioteca Jellyfin |
| `POST` | `/api/chat` | Enviar mensaje al asistente |
| `GET` | `/api/memory` | Contexto de memoria de sesión |
| `POST` | `/api/memory/save` | Guardar contexto de sesión |

### Ejemplo de respuesta `/api/chat`

```json
{
  "response": "Aquí tienes 5 películas de terror:\n- Hereditary (2018)\n...",
  "model": "gemini-2.5-flash",
  "recommendations": [
    {
      "title": "Hereditary",
      "type": "Pelicula",
      "year": 2018,
      "rating": 7.3,
      "posterUrl": "https://image.tmdb.org/...",
      "description": "...",
      "jellyfin": {
        "available": true,
        "playUrl": "https://jellyfin.ejemplo.com/web/index.html#!/details?id=abc123",
        "statusMessage": "Disponible en Jellyfin, puedes abrirla ya."
      }
    }
  ]
}
```

---

## Solución de problemas

### Los enlaces del chat apuntan a una IP interna (ej. `http://10.0.0.1:8096`)

**Causa:** `JELLYFIN_PUBLIC_URL` no está definida en el servicio. El fallback usa `JELLYFIN_URL`, que puede ser una IP interna.

**Solución:**
```bash
# Con Docker Compose: edita .env y recrea el contenedor
docker compose up -d --force-recreate

# Con Docker Swarm: inyecta la variable directamente
docker service update \
  --env-add JELLYFIN_PUBLIC_URL=https://tu-jellyfin.ejemplo.com \
  gcp_chat-ia
```

Verifica el valor efectivo mirando los logs al arrancar:
```bash
docker logs <container> 2>&1 | grep "Jellyfin public URL"
# INFO  Jellyfin public URL: https://tu-jellyfin.ejemplo.com
# WARNING  Jellyfin public URL: http://10.0.0.1:8096 — ADVERTENCIA: parece una direccion interna...
```

---

### El asistente no responde o ignora preguntas

1. Comprueba que `GENAI_API_KEY` está definida y es válida.
2. Verifica `GET /api/health` — el campo `assistantConfigured` debe ser `true`.
3. Revisa los logs del contenedor para errores de autenticación con Gemini.

---

### La biblioteca aparece vacía o con 0 elementos

1. Comprueba que `JELLYFIN_URL`, `JELLYFIN_API_KEY` y `JELLYFIN_USER_ID` son correctos.
2. La sincronización ocurre al arrancar y cada `CACHE_REFRESH_INTERVAL_SECONDS` (por defecto 1 hora). Espera unos segundos tras el primer arranque.
3. En `GET /api/library/overview`, el campo `sync.isConnected` debe ser `true`. Si hay error, `sync.lastError` mostrará el motivo.

---

### Los posters no se cargan

- Sin `TMDB_API_KEY`: se usan las imágenes de Jellyfin como fallback automático.
- Con `TMDB_API_KEY` inválida: los logs mostrarán errores en `TmdbImageService`.

---

### Error `frontend_not_built` al acceder a la app

El directorio `dist/` no existe. Compila el frontend antes de arrancar en producción:
```bash
npm run build
```
Con Docker esto ocurre automáticamente en el stage `frontend-builder` del `dockerfile`.

---

### Cambios en `.env` no se aplican tras redespliegue en Swarm

En Docker Swarm, `docker service update --image` **no relee el archivo `.env`**. Las variables quedan congeladas en la definición del servicio desde el último `docker stack deploy`. Para actualizarlas:

```bash
# Variable a variable
docker service update --env-add VARIABLE=nuevo_valor gcp_chat-ia

# O redesplegar el stack completo (relee el .env)
docker stack deploy -c cloud-chat-ia.yaml gcp --with-registry-auth
```

---

## Despliegue bare-metal (Nginx + systemd)

```bash
# 1. Copia los archivos al servidor
cp -r . /opt/jellyfin-ai-chat
cd /opt/jellyfin-ai-chat

# 2. Instala dependencias
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
npm install && npm run build

# 3. Configura Nginx
cp deploy/nginx/chat-raspihub.conf /etc/nginx/sites-available/jellyfin-ai-chat
# Edita server_name con tu dominio
ln -s /etc/nginx/sites-available/jellyfin-ai-chat /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 4. Configura el servicio systemd
cp deploy/systemd/chat-raspihub.service /etc/systemd/system/jellyfin-ai-chat.service
# Edita WorkingDirectory y EnvironmentFile con las rutas correctas
systemctl enable --now jellyfin-ai-chat
```
