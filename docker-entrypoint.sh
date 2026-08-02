#!/bin/sh
set -e

# Optional: run Prisma migrations if DATABASE_URL is configured
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] DATABASE_URL detected — running Prisma migrations"
  # ensure node_modules exist
  if [ -x "./node_modules/.bin/prisma" ]; then
    npx prisma migrate deploy
  else
    echo "[entrypoint] prisma binary not found in node_modules — attempting npx prisma"
    npx prisma migrate deploy
  fi
else
  echo "[entrypoint] DATABASE_URL not set — skipping Prisma migrations"
fi

# Exec the server process
echo "[entrypoint] Starting server"
exec node dist/server.js
