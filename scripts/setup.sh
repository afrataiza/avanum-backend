#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v supabase >/dev/null 2>&1 || {
  echo "Supabase CLI is required."
  exit 1
}

echo "==> Starting local Supabase"
supabase start

echo "==> Resetting local database schema"
supabase db reset --no-seed

echo "==> Loading local Supabase credentials"
source scripts/lib/load-supabase-env.sh

echo
echo "Local backend is ready."
echo "Supabase API: http://127.0.0.1:54321"
echo "Supabase Studio: http://127.0.0.1:54323"
echo
echo "Initialize the QA environment with:"
echo "  ./scripts/seed-qa.sh"
echo
echo "Start Edge Functions with:"
echo "  supabase functions serve --env-file .env"
