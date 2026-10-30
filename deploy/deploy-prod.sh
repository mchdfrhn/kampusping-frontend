#!/usr/bin/env bash
# Build and (re)start the web app on a Linux host with PM2 (+ optional Nginx).
#
# Usage:
#   bash deploy/deploy-prod.sh           # install, build, restart PM2
#   bash deploy/deploy-prod.sh --nginx   # also install the Nginx site
#   bash deploy/deploy-prod.sh --all     # same as --nginx
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PM2_CONFIG="${SCRIPT_DIR}/ecosystem.prod.config.js"
APP_NAME="webapp-frontend"
APP_PORT=8094
RUN_NGINX=false

for arg in "$@"; do
  case "${arg}" in
    --nginx|--all) RUN_NGINX=true ;;
    -h|--help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: ${arg}" >&2
      exit 1
      ;;
  esac
done

cd "${REPO_ROOT}"

# NEXT_PUBLIC_* values are inlined at build time, so .env must exist before `npm run build`.
if [[ ! -f ".env" ]]; then
  echo "Missing .env. Copy deploy/.env.production.example to .env and fill in real values." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building"
npm run build

echo "==> PM2: ${APP_NAME}"
pm2 delete "${APP_NAME}" 2>/dev/null || true
pm2 start "${PM2_CONFIG}"
pm2 save

sleep 3
if ! curl -fsS -o /dev/null "http://127.0.0.1:${APP_PORT}/login"; then
  echo "ERROR: health check failed" >&2
  pm2 logs "${APP_NAME}" --lines 40 --nostream || true
  exit 1
fi

if [[ "${RUN_NGINX}" == true ]]; then
  bash "${SCRIPT_DIR}/install-nginx-prod.sh"
fi

echo "==> Frontend deployed"
pm2 status "${APP_NAME}"
