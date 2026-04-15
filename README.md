# RaspiHub AI

Frontend y backend desacoplados para consultar una biblioteca Jellyfin con una interfaz moderna en React, TypeScript y Tailwind 4, servida por una API Flask lista para producción.

## Arquitectura

- `server/`: backend Flask modular con servicios para Jellyfin, auditoría TMDB y asistente.
- `src/`: frontend Vite + React + TypeScript.
- `src/components/ui/`: estructura compatible con shadcn para componentes reutilizables. En este proyecto se usa dentro de `src/` porque Vite compila desde esa carpeta y así mantenemos aliases estables con `@/components/ui`.
- `deploy/`: ejemplos de `nginx` y `systemd` para despliegue real.

## Desarrollo

1. Copia `.env.example` a `.env` y completa las variables necesarias.
2. Instala frontend:

```bash
npm install
```

3. Instala backend:

```bash
python -m pip install -r requirements.txt
```

4. Ejecuta Flask en `:3752` y Vite en `:5173`.

## Producción

```bash
npm run build
gunicorn --config gunicorn.conf.py wsgi:application
```

O bien:

```bash
docker compose up --build -d
```

## API principal

- `GET /api/health`
- `GET /api/library/overview`
- `POST /api/chat`

## Notas

- El componente base solicitado está integrado en `src/components/ui/claude-style-chat-input.tsx`.
- El backend sirve `dist/` automáticamente en producción, con fallback SPA.
