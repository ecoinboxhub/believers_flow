#!/bin/bash
set -e

# Migrations are best-effort at boot. The app already handles an unavailable
# database in degraded mode: /api/health answers without a pool, and routes
# guarded by require_db() return 503 until the pool is ready. Failing the
# container here instead turns a database outage into a total outage and makes
# every Render deploy report update_failed.
echo "Running database migrations (best-effort)..."
if ! python -c "
import asyncio
from api.database import init_db
asyncio.run(init_db())
print('Migrations complete.')
"; then
    echo "WARNING: migrations failed; starting in degraded mode (DB-dependent routes will return 503)."
fi

echo "Starting server..."
exec uvicorn api.index:app --host 0.0.0.0 --port 8000 --workers 4
