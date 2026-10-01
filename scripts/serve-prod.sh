#!/usr/bin/env bash
# Start the Next.js standalone production server for local verification.
# Usage: scripts/serve-prod.sh [PORT]
set -euo pipefail

PORT="${1:-3100}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/.next/standalone/pilkasis"

if [ ! -f "$DIST/server.js" ]; then
  echo "Standalone build not found. Run 'bun run build' first." >&2
  exit 1
fi

export PORT
export HOSTNAME="0.0.0.0"
export NODE_ENV="production"
export DATABASE_URL="${DATABASE_URL:-file:$ROOT/db/custom.db}"

exec bun "$DIST/server.js"