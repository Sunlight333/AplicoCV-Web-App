# AplicoCV — Deployment

Production runs on a single VPS (Ubuntu 24.04, ≥4 vCPU / 8 GB RAM):

- **Docker Compose** runs the backend stack — FastAPI (`api`), Celery `worker`,
  Celery `beat`, `redis`, `postgres` (see [`docker-compose.yml`](../docker-compose.yml)).
- **Nginx on the host** terminates TLS, serves the built SPA, and reverse-proxies
  `/api` to the `api` container (see [`nginx/aplicocv.conf`](nginx/aplicocv.conf)).
- **GitHub Actions** tests, builds the SPA, and deploys on push to `main`
  (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).

## One-time VPS setup

```bash
# 1. Install Docker Engine + Compose plugin, Nginx, Certbot
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sh

# 2. Clone the repo where the deploy workflow expects it
sudo git clone https://github.com/<you>/CV /opt/aplicocv
cd /opt/aplicocv

# 3. Configure secrets (NOT committed)
cp .env.example .env                      # POSTGRES_* + UVICORN_WORKERS
cp apps/api/.env.example apps/api/.env    # then edit: see below

# 4. Set production-critical keys in apps/api/.env
#    ENVIRONMENT=production
#    FRONTEND_URL=https://aplicocv.com
#    JWT_SECRET=<python -c "import secrets;print(secrets.token_urlsafe(48))">
#    FERNET_KEY=<python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())">
#    DATABASE_URL and REDIS_URL are overridden by docker-compose automatically.
#    (The API refuses to boot in production with the default JWT_SECRET or no FERNET_KEY.)

# 5. Bring up the backend
docker compose up -d --build

# 6. Web root + TLS
sudo mkdir -p /var/www/aplicocv /var/www/certbot
sudo cp deploy/nginx/aplicocv.conf /etc/nginx/sites-available/aplicocv.conf
sudo ln -s /etc/nginx/sites-available/aplicocv.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d aplicocv.com -d www.aplicocv.com -d api.aplicocv.com
sudo nginx -t && sudo systemctl reload nginx
```

## GitHub Actions secrets

Set these in the repo (Settings → Secrets and variables → Actions):

| Secret | Purpose |
| --- | --- |
| `VPS_HOST` | VPS IP / hostname |
| `VPS_USER` | SSH user (in the `docker` group) |
| `VPS_SSH_KEY` | Private key whose public key is in the VPS `authorized_keys` |

On every push to `main` the workflow runs backend tests + the SPA build, copies
`apps/web/dist` to `/var/www/aplicocv`, then `git pull` + `docker compose up -d
--build` on the VPS.

## Database migrations

The app uses `create_all` on startup for the MVP. To switch to managed
migrations (recommended once on Postgres):

```bash
docker compose exec api alembic revision --autogenerate -m "init"
docker compose exec api alembic upgrade head
```

## Operational notes

- **Logs:** `docker compose logs -f api worker beat`
- **Health:** `curl https://aplicocv.com/api/health` shows which integrations are live.
- **Uploads** persist in the `uploads` volume; **Postgres** in `pgdata`; **Redis** in `redisdata`.
- The Chrome extension ships pointing at `https://aplicocv.com/api`
  (`apps/extension/src/config.js`), so the same Nginx `/api` proxy serves it.
