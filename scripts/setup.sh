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

echo "==> Resetting local database"
supabase db reset

echo
echo "Local backend is ready."
echo "Supabase API: http://127.0.0.1:54321"
echo "Supabase Studio: http://127.0.0.1:54323"
