#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

QA_EMAIL="qa@avanum.local"
QA_PASSWORD="${AVANUM_QA_PASSWORD:-avanum-local-qa}"
QA_USER_ID="00000000-0000-0000-0000-000000000018"
BASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$ANON_KEY" ]; then
  echo "SUPABASE_ANON_KEY is required."
  echo "Set it in .env before running this script."
  exit 1
fi

response="$(curl -fsS "${BASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{"email":"${QA_EMAIL}","password":"${QA_PASSWORD}"}")"

echo "$response"

echo
echo "Expected QA user id:"
echo "$QA_USER_ID"
