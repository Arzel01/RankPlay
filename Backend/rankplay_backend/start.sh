#!/bin/sh

python manage.py migrate --noinput
python manage.py collectstatic --noinput

gunicorn rankplay_backend.wsgi:application --bind 0.0.0.0:$PORT
