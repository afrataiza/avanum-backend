#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

QA_EMAIL="qa@avanum.local"
QA_PASSWORD="${AVANUM_QA_PASSWORD:-avanum-local-qa}"

command -v supabase >/dev/null 2>&1 || {
  echo "Supabase CLI is required."
  exit 1
}

echo "==> Resetting local database schema"
supabase db reset --no-seed

echo "==> Provisioning local QA Auth user"
export QA_EMAIL QA_PASSWORD
supabase db execute --local --file supabase/sql/create-qa-auth-user.sql

echo "==> Loading deterministic QA fixtures"
supabase db execute --local --file supabase/seed.sql

echo "QA environment is ready."
echo "QA user: $QA_EMAIL"
