# Deploy Frontend

Production: PM2 `127.0.0.1:8093` + Nginx `:80`. SSL di GCP Load Balancer.

```bash
cp deploy/.env.production.example .env
chmod +x deploy/*.sh
bash deploy/deploy-prod.sh --all
```

Ganti `server_name` di `nginx-prod.conf.example`. Lihat README root untuk arsitektur lengkap.
