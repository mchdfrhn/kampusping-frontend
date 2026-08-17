#!/usr/bin/env bash
# Deploy HIS Standard UI/UX frontend to production.
#
# Usage:
#   bash deploy/deploy-prod.sh              # build + PM2
#   bash deploy/deploy-prod.sh --nginx      # install Nginx site + reload
#   bash deploy/deploy-prod.sh --all        # build + PM2 + Nginx
#   bash deploy/deploy-prod.sh --skip-build # PM2 restart only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PM2_CONFIG="${SCRIPT_DIR}/ecosystem.prod.config.js"
APP_NAME="his-standard-uiux"
APP_PORT=8093
RUN_NGINX=false
SKIP_BUILD=false

for arg in "$@"; do
  case "${arg}" in
    --nginx) RUN_NGINX=true ;;
    --all) RUN_NGINX=true ;;
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      sed -n '2,10p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: ${arg}" >&2
      exit 1
      ;;
  esac
done

cd "${REPO_ROOT}"

if [[ ! -f ".env" ]]; then
  echo "Missing .env in ${REPO_ROOT}" >&2
  echo "Copy .env.example to .env and fill production values." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node.js 20 LTS first." >&2
  exit 1
fi

if [[ "${SKIP_BUILD}" == false ]]; then
  echo "==> npm ci"
  npm ci
  echo "==> npm run build"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
  npm run build
fi

echo "==> PM2 — ${APP_NAME}"
pm2 delete "${APP_NAME}" 2>/dev/null || true
pm2 start "${PM2_CONFIG}"
pm2 save

sleep 3
if ! curl -fsSI "http://127.0.0.1:${APP_PORT}" | head -n 1 | grep -q "200\|301\|302\|307\|308"; then
  echo "ERROR: health check gagal di http://127.0.0.1:${APP_PORT}" >&2
  pm2 logs "${APP_NAME}" --lines 40 --nostream || true
  exit 1
fi

if [[ "${RUN_NGINX}" == true ]]; then
  bash "${SCRIPT_DIR}/install-nginx-prod.sh"
fi

echo "==> Deploy frontend selesai"
pm2 status "${APP_NAME}"
