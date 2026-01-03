#!/bin/sh

echo ">>> Running migrations"
python manage.py migrate --noinput

echo ">>> Starting gunicorn"
gunicorn rankplay_backend.wsgi --bind 0.0.0.0:$PORT