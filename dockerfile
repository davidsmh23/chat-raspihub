FROM node:24-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY components.json index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM python:3.13-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3752

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py gunicorn.conf.py wsgi.py ./
COPY server ./server
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 3752

CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:application"]
