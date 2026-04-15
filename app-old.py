# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, jsonify, session
from flask_session import Session
import requests
import google.generativeai as genai
import json
import threading
import time
import os
import re # Importamos regex para detectar intenciones

# ==============================
# 🔐 Configuración general
# ==============================
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
JELLYFIN_URL = os.getenv("JELLYFIN_URL", "http://jellyfin:8096")
JELLYFIN_API_KEY = os.getenv("JELLYFIN_API_KEY")
USER_ID = os.getenv("JELLYFIN_USER_ID")
TMDB_API_KEY = os.getenv("TMDB_API_KEY") # <--- NUEVA VARIABLE DE ENTORNO

# Configurar modelo Gemini
genai.configure(api_key=GENAI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# ==============================
# ⚙️ Configuración Flask
# ==============================
app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "clave-secreta-segura")
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# ==============================
# 💾 Caché de Jellyfin
# ==============================
cache_peliculas = []
cache_series = []
cache_lock = threading.Lock()

def cargar_datos_jellyfin():
    """Carga inicial de películas y series desde Jellyfin."""
    global cache_peliculas, cache_series
    headers = {"X-Emby-Token": JELLYFIN_API_KEY}

    try:
        # Películas
        r = requests.get(
            f"{JELLYFIN_URL}/Users/{USER_ID}/Items?Recursive=true&IncludeItemTypes=Movie",
            headers=headers, timeout=15
        )
        r.raise_for_status()
        peliculas = r.json().get("Items", [])

        # Series (Importante: Traer ChildCount para saber cuántas temporadas hay locales)
        r = requests.get(
            f"{JELLYFIN_URL}/Users/{USER_ID}/Items?Recursive=true&IncludeItemTypes=Series&Fields=ChildCount",
            headers=headers, timeout=15
        )
        r.raise_for_status()
        series = r.json().get("Items", [])

        with cache_lock:
            cache_peliculas = peliculas
            cache_series = series

        print(f"✅ Datos cargados: {len(peliculas)} películas, {len(series)} series")

    except Exception as e:
        print(f"❌ Error cargando datos de Jellyfin: {e}")

def refrescar_cache_periodicamente():
    while True:
        time.sleep(3600)
        print("♻️ Refrescando caché de Jellyfin...")
        cargar_datos_jellyfin()

cargar_datos_jellyfin()
threading.Thread(target=refrescar_cache_periodicamente, daemon=True).start()

# ==============================
# 🔍 Auditoría de Series (TMDB)
# ==============================
def auditar_series_tmdb(series_locales):
    """
    Compara las series locales con TMDB para ver si faltan temporadas.
    Devuelve una lista de diccionarios con las discrepancias.
    """
    if not TMDB_API_KEY:
        return "ERROR: No hay API Key de TMDB configurada."

    reporte = []
    
    # Para no saturar, si hay muchas series, el proceso puede tardar. 
    # En producción real esto debería ser una tarea en segundo plano.
    for serie in series_locales:
        nombre = serie.get("Name")
        # En Jellyfin, ChildCount suele ser el numero de temporadas (a veces incluye "Specials")
        temporadas_locales = serie.get("ChildCount", 0) 
        
        try:
            # 1. Buscar ID en TMDB
            search_url = f"https://api.themoviedb.org/3/search/tv?api_key={TMDB_API_KEY}&query={nombre}"
            search_res = requests.get(search_url).json()
            
            if not search_res.get("results"):
                continue # No encontrada en TMDB
                
            tmdb_show = search_res["results"][0]
            tmdb_id = tmdb_show["id"]
            
            # 2. Obtener detalles completos (número real de temporadas)
            details_url = f"https://api.themoviedb.org/3/tv/{tmdb_id}?api_key={TMDB_API_KEY}"
            details = requests.get(details_url).json()
            
            temporadas_reales = details.get("number_of_seasons", 0)
            estado = details.get("status", "Unknown") # Returning Series, Ended, Canceled
            
            # 3. Comparar
            # Nota: A veces Jellyfin cuenta la carpeta "Specials" como una temporada.
            # Aquí asumimos que si la diferencia es >= 1, falta algo.
            if temporadas_reales > temporadas_locales:
                diff = temporadas_reales - temporadas_locales
                reporte.append({
                    "nombre": nombre,
                    "tienes": temporadas_locales,
                    "existen": temporadas_reales,
                    "faltan": diff,
                    "estado": estado
                })
                
        except Exception as e:
            print(f"Error revisando {nombre}: {e}")
            continue

    return reporte

# ==============================
# 📄 Funciones Auxiliares
# ==============================
def resumir_items(items):
    resumen = []
    for item in items:
        resumen.append({
            "nombre": item.get("Name"),
            "tipo": item.get("Type"),
            "año": item.get("ProductionYear"),
            "temporadas_locales": item.get("ChildCount") # Añadido
        })
    return resumen

# ==============================
# 🌐 Rutas Flask
# ==============================
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "").strip()

    if not user_input:
        return jsonify({"response": "Por favor, escribe un mensaje."})

    historial = session.get("historial", [])
    historial.append({"rol": "usuario", "contenido": user_input})

    # --- LÓGICA DE DETECCIÓN DE INTENCIÓN ---
    # Detectamos si el usuario quiere auditar las series
    palabras_clave = ["al día", "actualiz", "falta", "temporada", "nuevos episodios", "completa"]
    audit_requested = any(keyword in user_input.lower() for keyword in palabras_clave)
    
    audit_data_text = ""
    
    if audit_requested:
        print("🕵️ Usuario pide auditoría de series. Consultando TMDB...")
        with cache_lock:
            # Hacemos una copia para no bloquear
            series_para_revisar = list(cache_series)
        
        # Ejecutamos la auditoría
        resultado_auditoria = auditar_series_tmdb(series_para_revisar)
        
        if isinstance(resultado_auditoria, str) and "ERROR" in resultado_auditoria:
            audit_data_text = "AVISO DEL SISTEMA: No se pudo conectar a TMDB (Falta API Key)."
        elif not resultado_auditoria:
            audit_data_text = "SISTEMA: El análisis de TMDB indica que TODAS las series locales están al día."
        else:
            audit_data_text = f"REPORTE DE AUDITORÍA TMDB (Series desactualizadas):\n{json.dumps(resultado_auditoria, indent=2)}"

    # Obtenemos el contexto estándar
    with cache_lock:
        contexto = {
            "peliculas": resumir_items(cache_peliculas),
            "series": resumir_items(cache_series)
        }
    contexto_texto = json.dumps(contexto, ensure_ascii=False, indent=2)

    # Convertir historial a texto
    chat_history_text = "\n".join(f"{msg['rol'].capitalize()}: {msg['contenido']}" for msg in historial)

    prompt = f"""
Eres un asistente experto del servidor Jellyfin del usuario.

CONTEXTO ACTUAL DE LA BIBLIOTECA (LO QUE EL USUARIO TIENE):
{contexto_texto}

INFORMACIÓN DE AUDITORÍA DE TEMPORADAS (INTERNET/TMDB):
{audit_data_text}

INSTRUCCIONES:
1. Usa la "Información de Auditoría" SOLO si el usuario pregunta si sus series están al día o qué falta.
2. Si el reporte de auditoría muestra series donde "existen" > "tienes", infórmaselo al usuario claramente en formato lista o tabla.
3. Si la auditoría está vacía o dice que todo está bien, felicita al usuario.
4. Si el usuario NO pregunta sobre actualizaciones, ignora la sección de auditoría y responde normalmente sobre la biblioteca.
5. "Specials" o "Temporada 0": A veces Jellyfin cuenta los especiales como una temporada. Si ves discrepancias de 1 temporada, menciona que podría ser un especial, pero reporta lo que dice TMDB.

Conversación hasta ahora:
{chat_history_text}

Asistente:
"""

    try:
        response = model.generate_content(prompt)
        respuesta = response.text.strip()
    except Exception as e:
        print(f"❌ Error Gemini: {e}")
        return jsonify({"response": "Hubo un error procesando tu solicitud."})

    historial.append({"rol": "asistente", "contenido": respuesta})
    session["historial"] = historial[-10:]

    return jsonify({"response": respuesta})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3752)
