#!/bin/bash
set -euo pipefail

# Migraciones idempotentes (CREATE TABLE/INDEX IF NOT EXISTS en schema.sql).
# No ejecuta DROP destructivo ni seed de admin.
#
# Uso:
#   DATABASE_URL=postgresql://... ./database/migrate.sh
#
# Producción / staging:
#   Preferible un rol de migración con DDL, distinto del rol de aplicación (DML).
#   No aplicar contra producción sin autorización explícita y backup.
#   seed_admin.sql es MANUAL y separado — no lo invoca este script.

DB_URL=${DATABASE_URL:?DATABASE_URL no configurada}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/schema.sql"
REFRESH_FILE="${SCRIPT_DIR}/refresh_sessions.sql"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"

if [[ ! -f "${SCHEMA_FILE}" ]]; then
  echo "ERROR: no se encuentra ${SCHEMA_FILE}" >&2
  exit 1
fi

echo "Ejecutando migraciones idempotentes contra la base indicada en DATABASE_URL..."

psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${SCHEMA_FILE}"

if [[ -f "${REFRESH_FILE}" ]]; then
  psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${REFRESH_FILE}"
fi

if [[ -d "${MIGRATIONS_DIR}" ]]; then
  echo "Aplicando migrations numeradas en ${MIGRATIONS_DIR}..."
  while IFS= read -r migration; do
    echo "  -> ${migration}"
    psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${migration}"
  done < <(find "${MIGRATIONS_DIR}" -maxdepth 1 -type f -name '*.sql' | sort)
fi

echo "Base de datos configurada (schema + refresh_sessions + migrations)."
