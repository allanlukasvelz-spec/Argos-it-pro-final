#!/usr/bin/env bash
# Isolated restore drill — does NOT destroy primary staging volumes.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/docker/.env.staging"

BACKUP_DIR="${1:-}"
if [[ -z "$BACKUP_DIR" || ! -f "$BACKUP_DIR/postgres.dump" ]]; then
  echo "Usage: $0 <backup-dir-with-postgres.dump>" >&2
  exit 1
fi

PRIMARY=(docker compose -f "$ROOT/docker/docker-compose.staging.yml" --env-file "$ROOT/docker/.env.staging")
export STAGING_RESTORE_API_PORT="${STAGING_RESTORE_API_PORT:-4011}"
export STAGING_RESTORE_FRONTEND_PORT="${STAGING_RESTORE_FRONTEND_PORT:-3011}"
# Compose base file uses STAGING_API_PORT — remap so restore does not collide with primary :4010
export STAGING_API_PORT="$STAGING_RESTORE_API_PORT"
export STAGING_FRONTEND_PORT="$STAGING_RESTORE_FRONTEND_PORT"
export STAGING_FRONTEND_URL="http://127.0.0.1:${STAGING_API_PORT}"
export STAGING_CORS_ORIGINS="http://127.0.0.1:${STAGING_FRONTEND_PORT}"

RESTORE=(
  docker compose
  -f "$ROOT/docker/docker-compose.staging.yml"
  -f "$ROOT/docker/docker-compose.staging.restore.yml"
  --env-file "$ROOT/docker/.env.staging"
)

echo "[restore-drill] tearing down prior restore stack (if any)..."
"${RESTORE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true

echo "[restore-drill] starting postgres+minio only..."
"${RESTORE[@]}" up -d postgres minio
echo "[restore-drill] waiting for postgres..."
for i in $(seq 1 60); do
  if "${RESTORE[@]}" exec -T postgres pg_isready -U "$STAGING_POSTGRES_USER" -d "$STAGING_POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[restore-drill] restoring postgres from dump (skip migrate — schema in dump)..."
# Drop/recreate public schema then restore
"${RESTORE[@]}" exec -T postgres \
  psql -U "$STAGING_POSTGRES_USER" -d "$STAGING_POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO PUBLIC;"

"${RESTORE[@]}" exec -T postgres \
  pg_restore -U "$STAGING_POSTGRES_USER" -d "$STAGING_POSTGRES_DB" --no-owner --role="$STAGING_POSTGRES_USER" \
  < "$BACKUP_DIR/postgres.dump" || true
# pg_restore may warn on role ownership; verify tables
"${RESTORE[@]}" exec -T postgres \
  psql -U "$STAGING_POSTGRES_USER" -d "$STAGING_POSTGRES_DB" -c "SELECT COUNT(*) FROM organizations;" >/dev/null

echo "[restore-drill] restoring minio objects..."
BUCKET="${STAGING_MINIO_BUCKET:-argos-evidence-staging}"
BACKUP_ABS=$(cd "$BACKUP_DIR" && pwd)
if [[ -d "$BACKUP_ABS/minio/$BUCKET" ]]; then
  "${RESTORE[@]}" run --rm --no-deps \
    -v "$BACKUP_ABS/minio:/backup:ro" \
    --entrypoint /bin/sh \
    minio-init -c "
      mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" &&
      mc mb --ignore-existing local/\$MINIO_BUCKET &&
      mc anonymous set none local/\$MINIO_BUCKET &&
      mc mirror --overwrite /backup/\$MINIO_BUCKET local/\$MINIO_BUCKET &&
      echo mirrored_ok
    "
else
  echo "[restore-drill] WARN: no minio objects in backup (empty bucket ok for schema-only)"
  "${RESTORE[@]}" run --rm --no-deps --entrypoint /bin/sh minio-init -c "
    mc alias set local http://minio:9000 \"\$MINIO_ROOT_USER\" \"\$MINIO_ROOT_PASSWORD\" &&
    mc mb --ignore-existing local/\$MINIO_BUCKET &&
    mc anonymous set none local/\$MINIO_BUCKET
  "
fi

echo "[restore-drill] starting api+worker (migrate skipped — dump has schema)..."
# Mark migrate as succeeded by running a no-op completed service: start api with depends that may wait migrate
# Force recreate migrate as success by running migrate against already-restored DB (idempotent forward)
"${RESTORE[@]}" run --rm migrate || true
"${RESTORE[@]}" up -d api worker frontend

echo "[restore-drill] waiting for API ready on :$STAGING_RESTORE_API_PORT ..."
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${STAGING_RESTORE_API_PORT}/api/ready" || echo 000)
  if [[ "$code" == "200" ]]; then
    echo "[restore-drill] API READY"
    break
  fi
  sleep 2
done

VERIFY_JSON=$(curl -s "http://127.0.0.1:${STAGING_RESTORE_API_PORT}/api/ready")
echo "[restore-drill] ready=$VERIFY_JSON"

# In-container verification of tenant+evidence
"${RESTORE[@]}" exec -T api node -e '
const {Pool}=require("pg");
(async()=>{
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  const orgs=await pool.query("SELECT id, slug FROM organizations ORDER BY id");
  const ev=await pool.query("SELECT id, object_key, sha256 FROM evidence_objects LIMIT 5");
  const runs=await pool.query("SELECT id, status FROM report_runs LIMIT 5");
  const notes=await pool.query("SELECT id FROM notifications LIMIT 5");
  const jobs=await pool.query("SELECT status, COUNT(*)::int n FROM platform_jobs GROUP BY status");
  console.log(JSON.stringify({orgs:orgs.rows, evidence:ev.rows, reportRuns:runs.rows, notifications:notes.rows, jobs:jobs.rows},null,2));
  if(orgs.rowCount<2) throw new Error("expected >=2 orgs after restore");
  if(ev.rowCount<1) throw new Error("expected evidence after restore");
  await pool.end();
})().catch(e=>{console.error(e);process.exit(1)});
'

# Evidence bytes + reconcile dry-run
"${RESTORE[@]}" exec -T api node -e '
const {Pool}=require("pg");
const {configureEvidenceStore,getEvidenceStore}=require("./lib/platform/evidenceStore");
const {reconcileEvidence}=require("./lib/platform/evidenceReconciliation");
const crypto=require("crypto");
(async()=>{
  configureEvidenceStore();
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  const {rows}=await pool.query("SELECT object_key, sha256 FROM evidence_objects WHERE status='\''AVAILABLE'\'' LIMIT 1");
  if(!rows[0]) throw new Error("no evidence");
  const buf=await getEvidenceStore().get(rows[0].object_key);
  const dig=crypto.createHash("sha256").update(buf).digest("hex");
  if(dig!==rows[0].sha256) throw new Error("sha mismatch "+dig+" vs "+rows[0].sha256);
  const report=await reconcileEvidence(pool,{dryRun:true,organizationId:null});
  console.log(JSON.stringify({shaOk:true, reconcileDryRun:report.summary||report},null,2));
  await pool.end();
})().catch(e=>{console.error(e);process.exit(1)});
'

echo "[restore-drill] PASS backup=$BACKUP_DIR"
echo "RESTORE_API=http://127.0.0.1:${STAGING_RESTORE_API_PORT}"
