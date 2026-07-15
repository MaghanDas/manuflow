#!/bin/sh
set -e

echo "Waiting for database at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
python - << 'PYEOF'
import os
import socket
import time

host = os.environ.get("POSTGRES_HOST", "db")
port = int(os.environ.get("POSTGRES_PORT", 5432))

for _ in range(60):
    try:
        socket.create_connection((host, port), timeout=1).close()
        break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit("Database never became available")
PYEOF

python manage.py migrate --noinput
python manage.py seed_demo_data

if [ "$DJANGO_DEBUG" = "True" ]; then
    python manage.py runserver 0.0.0.0:8000
else
    gunicorn manuflow_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
