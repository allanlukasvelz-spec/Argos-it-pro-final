#!/bin/bash
set -euo pipefail

# Script para ejecutar migraciones de BD

DB_URL=${DATABASE_URL:?DATABASE_URL no configurada}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/schema.sql"

echo "🔄 Ejecutando migraciones..."

psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${SCHEMA_FILE}"

echo "✅ Base de datos configurada"
