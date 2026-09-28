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

echo "","Local backend is ready."
