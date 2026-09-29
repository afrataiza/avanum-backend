#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source scripts/lib/load-supabase-env.sh

QA_EMAIL="qa@avanum.local"
QA_PASSWORD="${AVANUM_QA_PASSWORD:-avanum-local-qa}"
BASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-}"

if [ -z "$ANON_KEY" ]; then
  echo "SUPABASE_ANON_KEY is required."
  exit 1
fi

response="$(curl -fsS "${BASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${QA_EMAIL}\",\"password\":\"${QA_PASSWORD}\"}")"
echo "$response"
