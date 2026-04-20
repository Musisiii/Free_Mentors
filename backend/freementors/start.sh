#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE=freementors_project.settings

cd /home/runner/workspace/freementors

echo "Running migrations..."
python manage.py migrate --run-syncdb

echo "Seeding database..."
python manage.py seed_db

echo "Starting server..."
PORT=${PORT:-8000}
python manage.py runserver 0.0.0.0:$PORT
