#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Running Deno tests"
deno test --allow-env supabase/functions/_shared

echo
echo "==> Running TypeScript compiler checks"
deno check supabase/functions/_shared/reading/update-reading-progress-service.test.ts
