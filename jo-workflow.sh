#!/usr/bin/env sh
# jo-workflow.sh - launcher for the Node.js engine (src/cli.js).
# Usage: jo-workflow.sh --help
set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 18+ is required (https://nodejs.org)." >&2
  exit 1
fi

# Resolve the real script location, following symlinks (e.g. ~/bin/jo-workflow).
self=$0
while [ -L "$self" ]; do
  link=$(readlink "$self")
  case "$link" in /*) self=$link ;; *) self=$(dirname "$self")/$link ;; esac
done
here=$(cd "$(dirname "$self")" && pwd)

exec node "$here/src/cli.js" "$@"
