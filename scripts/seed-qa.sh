#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

QA_EMAIL="qa@avanum.local"

command -v supabase >/dev/null 2>&1 || {
  echo "Supabase CLI is required."
  exit 1
}

command -v psql >/dev/null 2>&1 || {
  echo "psql is required."
  exit 1
}

echo "==> Resetting local database schema"
supabase db reset --no-seed

echo "==> Provisioning local QA Auth user"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/sql/create-qa-auth-user.sql

echo "==> Loading deterministic QA fixtures"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/seed.sql

echo
echo "QA environment is ready."
echo "QA user: $QA_EMAIL"
echo "Password: avanum-local-qa"
