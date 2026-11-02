# Deploying the web app

Production layout: PM2 runs `next start` on `127.0.0.1:8094`, Nginx proxies port 80 to it, and TLS
is terminated in front (load balancer or Cloudflare). Node.js 20.9+.

```bash
cp deploy/.env.production.example .env   # set NEXT_PUBLIC_API_BASE_URL first: it is built in
chmod +x deploy/*.sh
bash deploy/deploy-prod.sh --all         # install, build, PM2, Nginx
```

Later releases: `git pull && bash deploy/deploy-prod.sh`.

- Edit `server_name` in `nginx-prod.conf.example` first; the installer refuses the placeholder.
- Changing any `NEXT_PUBLIC_*` value requires a rebuild.
- The refresh cookie is set by the API and uses `SameSite=Lax`, so serve the web app and the API
  from the same site (sibling subdomains such as `app.example.com` and `api.example.com`). A
  different registrable domain would need `COOKIE_SAMESITE=none` on the API, which weakens CSRF
  protection; put both behind one domain instead.
- Prefer containers? See the repository root `docker-compose.yml`.

## Deploy order

The four processes belong to one release. Roll them out in this order:

1. **Migrate** the database (`--migrate` here).
2. **API** (`kampusping-backend`, 127.0.0.1:8093).
3. **Worker** (`kampusping-worker`).
4. **Gateway** (`kampusping-wa-gateway`, 127.0.0.1:8095, see `kampusping-wa-gateway/deploy/`).
5. **Web** (`kampusping-frontend`, 127.0.0.1:8094, see `kampusping-frontend/deploy/`).

This repo covers step 5 only. Deploy the web app last, after the API it calls is up. The worker
(`kampusping-worker`, backend repo) must stay at exactly one instance: **never run two workers**.
