#!/bin/bash

# Script para ejecutar migraciones de BD

DB_URL=${DATABASE_URL:?DATABASE_URL no configurada}

echo "🔄 Ejecutando migraciones..."

psql $DB_URL < /database/schema.sql

echo "✅ Base de datos configurada"
