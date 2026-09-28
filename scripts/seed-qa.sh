#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Resetting local database with QA seed"
supabase db reset

echo
echo "QA seed loaded."
echo "QA user id: 00000000-0000-0000-0000-000000000018"
echo
echo "Note: the SQL seed creates domain data only."
echo "Create a matching Auth user separately for authenticated-flow testing."
