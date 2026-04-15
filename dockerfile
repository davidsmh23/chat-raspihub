FROM python:3.11-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar aplicación
COPY . .

EXPOSE 3752

CMD ["python", "app.py"]

