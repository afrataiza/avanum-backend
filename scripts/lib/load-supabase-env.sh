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

if [ -z "${SUPABASE_ANON_KEY:-}" ]; then
  # The Supabase CLI exposes the local anon key through `supabase status`.
  # This keeps qa-login.sh usable on a clean clone without requiring .env.
  SUPABASE_ANON_KEY="$(supabase status -o env | sed -n 's/^ANON_KEY=//p')"
  export SUPABASE_ANON_KEY
fi

if [ -z "${SUPABASE_URL:-}" ]; then
  SUPABASE_URL="$(supabase status -o env | sed -n 's/^API_URL=//p')"
  export SUPABASE_URL
fi
