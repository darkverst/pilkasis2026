#!/usr/bin/env bash
# Local verification gate. Run this before committing or deploying.
#
#   ./scripts/verify.sh              # typecheck + lint + build + prod smoke test
#   ./scripts/verify.sh --no-build   # skip the slow production build
#
# It boots the freshly built standalone server on a spare port, runs the API
# smoke test against it, then shuts it down. That catches the class of bug
# where `next build` succeeds but the standalone bundle serves 404s for
# /_next/static, which the dev server hides completely.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RUN_BUILD=1
if [ "${1:-}" = "--no-build" ]; then
  RUN_BUILD=0
fi

step() {
  echo ""
  echo "════ $* ════"
}

step "1/4  typecheck"
bun run typecheck

step "2/4  lint"
bun run lint

if [ "$RUN_BUILD" -eq 1 ]; then
  step "3/4  production build"
  bun run build

  step "4/4  standalone server smoke test"
  PORT="${SMOKE_PORT:-3199}"
  ./scripts/serve-prod.sh "$PORT" >/tmp/verify-prod.log 2>&1 &
  SERVER_PID=$!

  cleanup() {
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  }
  trap cleanup EXIT INT TERM

  # Wait for the server to accept connections.
  ready=0
  for _ in $(seq 1 40); do
    if curl -fsS -o /dev/null --max-time 3 "http://localhost:$PORT/" 2>/dev/null; then
      ready=1
      break
    fi
    sleep 1
  done

  if [ "$ready" -ne 1 ]; then
    echo "ERROR: standalone server did not come up. Log:"
    cat /tmp/verify-prod.log
    exit 1
  fi

  # Static assets must be served, not 404 — this is what the build script fix
  # guarantees. Pull a real chunk URL out of the rendered HTML.
  CHUNK="$(curl -fsS "http://localhost:$PORT/" \
    | grep -oE '/_next/static/chunks/[A-Za-z0-9._-]+\.(js|css)' | head -n 1 || true)"
  if [ -z "$CHUNK" ]; then
    echo "ERROR: no static asset reference found in the served HTML." >&2
    exit 1
  fi
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://localhost:$PORT$CHUNK")"
  if [ "$CODE" != "200" ]; then
    echo "ERROR: static asset $CHUNK returned $CODE (expected 200)." >&2
    echo "       The standalone bundle is missing .next/static — run bun run build." >&2
    exit 1
  fi
  echo "✓ static asset served: $CHUNK (200)"

  BASE_URL="http://localhost:$PORT" DATABASE_URL="${DATABASE_URL:-file:$ROOT/db/custom.db}" \
    bun run scripts/smoke-test.ts
else
  step "3/4  production build — skipped"
  step "4/4  smoke test — skipped"
fi

echo ""
echo "✓ all checks passed"