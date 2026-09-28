#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

QA_USER_ID="00000000-0000-0000-0000-000000000018"
QA_EMAIL="qa@avanum.local"
QA_PASSWORD="${AVANUM_QA_PASSWORD:-avanum-local-qa}"

command -v supabase >/dev/null 2>&1 || {
  echo "Supabase CLI is required."
  exit 1
}

echo "==> Resetting local database"
supabase db reset

echo "==> Provisioning local QA Auth user"
export QA_USER_ID QA_EMAIL QA_PASSWORD

deno run --allow-env --allow-net supabase/scripts/ensure-qa-user.ts

echo
echo "QA environment is ready."
echo "QA user: $QA_EMAIL"
echo "QA user id: $QA_USER_ID"
echo
echo "Override the default QA password with:"
echo "  AVANUM_QA_PASSWORD='your-password' ./scripts/seed-qa.sh"
