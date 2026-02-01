#!/bin/sh
set -e
echo "Running migrations..."
if ! alembic upgrade head 2>/dev/null; then
  echo "Migration failed (e.g. partial DB). Stamping and ensuring tables..."
  alembic stamp head
fi
echo "Ensuring all tables exist..."
python -c "
from app.core.database import engine, Base
import app.models
Base.metadata.create_all(bind=engine, checkfirst=True)
"
echo "Creating admin user (if not set, skip with ADMIN_USERNAME=no)..."
if [ -n "$ADMIN_USERNAME" ] && [ "$ADMIN_USERNAME" != "no" ] && [ -n "$ADMIN_PASSWORD" ]; then
  python -m scripts.init_admin
fi
echo "Initializing data (about page, site_config)..."
python -m scripts.init_data 2>/dev/null || true
echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
