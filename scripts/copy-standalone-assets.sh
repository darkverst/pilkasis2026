#!/usr/bin/env bash
# Copy the static build output into the standalone server bundle.
#
# `next build` with output:"standalone" emits a *runnable server* under
# .next/standalone/<relative-project-path>/ — here that is
# .next/standalone/pilkasis/. Static assets and public/ are NOT copied by
# Next, so without this step the server boots and serves HTML, but every
# /_next/static/* request 404s and the page renders unstyled and inert.
#
# Why a script instead of the inline `cp` in package.json:
#   - the destination path depends on where the project sits relative to the
#     workspace root, so it must be discovered, not hardcoded
#   - it must fail loudly if the server entry is missing, instead of silently
#     producing a bundle that boots but serves no assets
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STANDALONE_ROOT=".next/standalone"

if [ ! -d "$STANDALONE_ROOT" ]; then
  echo "ERROR: $STANDALONE_ROOT not found. Is output:\"standalone\" set in next.config.ts?" >&2
  exit 1
fi

# Locate the directory that actually contains server.js. Next nests it under
# the project's path relative to the detected workspace root, so it is not
# always .next/standalone itself.
SERVER_DIR="$(find "$STANDALONE_ROOT" -name server.js -type f \
  -not -path '*/node_modules/*' -printf '%h\n' 2>/dev/null | head -n 1)"

if [ -z "$SERVER_DIR" ]; then
  echo "ERROR: no server.js found under $STANDALONE_ROOT — standalone output was not produced." >&2
  exit 1
fi

echo "→ standalone server: $SERVER_DIR"

# .next/static -> <server dir>/.next/static
mkdir -p "$SERVER_DIR/.next"
rm -rf "$SERVER_DIR/.next/static"
cp -r .next/static "$SERVER_DIR/.next/static"
echo "✓ copied .next/static -> $SERVER_DIR/.next/static"

# public -> <server dir>/public
rm -rf "$SERVER_DIR/public"
cp -r public "$SERVER_DIR/public"
echo "✓ copied public -> $SERVER_DIR/public"

# Fail loudly if a static chunk referenced by the build did not land.
FIRST_CHUNK="$(find .next/static/chunks -name '*.js' -type f 2>/dev/null | head -n 1 || true)"
if [ -n "$FIRST_CHUNK" ]; then
  REL="chunks/$(basename "$FIRST_CHUNK")"
  if [ ! -f "$SERVER_DIR/.next/static/$REL" ]; then
    echo "ERROR: static chunk $REL missing from standalone bundle." >&2
    exit 1
  fi
  echo "✓ verified static chunk present: $REL"
fi