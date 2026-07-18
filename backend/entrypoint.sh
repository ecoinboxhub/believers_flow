#!/bin/bash
set -e

echo "Running database migrations..."
python -c "
import asyncio
from api.database import init_db
asyncio.run(init_db())
print('Migrations complete.')
"

echo "Starting server..."
exec uvicorn api.index:app --host 0.0.0.0 --port 8000 --workers 4
