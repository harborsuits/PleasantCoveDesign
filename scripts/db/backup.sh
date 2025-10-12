#!/usr/bin/env bash
set -euo pipefail

if [[ "${FORCE_FLUSH:-false}" != "true" ]]; then
  echo "Refusing to run without FORCE_FLUSH=true"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL not set"
  exit 1
fi

mkdir -p backups
ts=$(date +"%Y-%m-%dT%H-%M-%S")
outfile="backups/${ts}.sql"

echo "Backing up database to ${outfile}"
pg_dump --no-owner --no-privileges "$DATABASE_URL" > "$outfile"
echo "Done."


