#!/usr/bin/env bash
# Chạy migration + seed + test RLS/RPC trên Postgres 16 local (không cần Docker / Supabase CLI).
# Dùng: pnpm db:test
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGPORT_TEST:-55432}"
DATA="$(mktemp -d /tmp/frego-pg-XXXXXX)"
SOCK="$DATA/sock"
mkdir -p "$SOCK"
RUN=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DATA"; RUN=(runuser -u postgres --); fi

"${RUN[@]}" "$PGBIN/initdb" -D "$DATA/db" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/db" -o "-p $PORT -k $SOCK -c listen_addresses=''" -l "$DATA/log" -w start >/dev/null
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/db" -m fast stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

PSQL=(psql -X -q -h "$SOCK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1)
"${PSQL[@]}" -f "$HERE/auth-stub.sql"
for f in "$ROOT"/migrations/*.sql; do
  echo "· migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "· seed.sql"
"${PSQL[@]}" -f "$ROOT/seed.sql"
echo "· test RLS và RPC"
"${PSQL[@]}" -f "$HERE/rls.test.sql"
echo "OK: migration, seed và toàn bộ test SQL đều qua."
