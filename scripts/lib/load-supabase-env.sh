#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required." >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${SUPABASE_URL:-}" ]; then
  SUPABASE_URL="http://127.0.0.1:54321"
  export SUPABASE_URL
fi

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  status_env="$(supabase status -o env 2>/dev/null || true)"
  SUPABASE_ANON_KEY="$(printf '%s\n' "$status_env" | sed -n 's/^ANON_KEY=//p' | tr -d '\r')"
  export SUPABASE_ANON_KEY
fi

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  echo "SUPABASE_ANON_KEY is required."
  echo "Add the local anon key to .env or export it before running qa-login.sh."
  exit 1
fi
