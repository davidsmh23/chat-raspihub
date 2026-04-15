import os


bind = f"0.0.0.0:{os.getenv('PORT', '3752')}"
workers = int(os.getenv("GUNICORN_WORKERS", "1"))
threads = int(os.getenv("GUNICORN_THREADS", "4"))
worker_class = "gthread"
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
graceful_timeout = 30
keepalive = 5
accesslog = "-"
errorlog = "-"
capture_output = True
