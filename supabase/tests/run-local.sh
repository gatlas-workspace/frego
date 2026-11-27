#!/usr/bin/env bash
# Chạy migration + seed + test RLS/RPC trên Postgres 16 local (không cần Docker / Supabase CLI).
# Dùng: pnpm db:test
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
# Thư mục chương trình Postgres 16: tự dò (Linux apt, Homebrew, PATH), hoặc đặt PGBIN=… trước lệnh.
if [ -z "${PGBIN:-}" ]; then
  for d in /usr/lib/postgresql/16/bin /opt/homebrew/opt/postgresql@16/bin /usr/local/opt/postgresql@16/bin; do
    [ -x "$d/initdb" ] && PGBIN="$d" && break
  done
  if [ -z "${PGBIN:-}" ] && command -v pg_config >/dev/null; then PGBIN="$(pg_config --bindir)"; fi
fi
if [ -z "${PGBIN:-}" ] || [ ! -x "$PGBIN/initdb" ]; then
  echo "Không tìm thấy Postgres 16 (initdb). Cài postgresql-16 (Linux) hoặc postgresql@16 (Homebrew), hoặc đặt PGBIN." >&2
  exit 1
fi
PORT="${PGPORT_TEST:-55432}"
DATA="$(mktemp -d "${TMPDIR:-/tmp}/frego-pg-XXXXXX")"
SOCK="$DATA/sock"
mkdir -p "$SOCK"
RUN=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DATA"; RUN=(runuser -u postgres --); fi

"${RUN[@]}" "$PGBIN/initdb" -D "$DATA/db" -U postgres --auth=trust -E UTF8 --locale=C >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/db" -o "-p $PORT -k $SOCK -c listen_addresses=''" -l "$DATA/log" -w start >/dev/null
cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/db" -m fast stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

PSQL=("$PGBIN/psql" -X -q -h "$SOCK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1)
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
