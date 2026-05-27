# Deployment Guide

Two pieces:

1. **Frontend** — React build → `/var/www/yashasviallen.is-a.dev/html`
2. **Backend** — FastAPI service → `127.0.0.1:27012`, proxied via nginx

---

## 1. nginx changes

Open the config:

```bash
sudo nano /etc/nginx/sites-available/yashasviallen.is-a.dev.conf
```

Add these blocks **inside the existing `server { ... }` block**. Place them **at the end**, _just before_ the closing `}`. Order matters — exact-match `location =` blocks (like `/github`) keep priority over the catch-all.

```nginx
    # ── Portfolio API proxy ─────────────────────────────────────────────
    location /api/portfolio/ {
        rewrite ^/api/portfolio/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:27012;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 30s;
    }

    # ── Aggressive caching for hashed build assets ──────────────────────
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ── SPA fallback (must come LAST among location blocks) ─────────────
    # Any request that didn't match a redirect, proxy, or static file
    # falls through to index.html so React Router can handle it.
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
```

Test + reload:

```bash
sudo nginx -t                  # verify config syntax
sudo systemctl reload nginx    # zero-downtime reload
```

---

## 2. Backend setup

```bash
# On the server (Ubuntu box that runs nginx)

# Create app directory
sudo mkdir -p /home/yashasvi/portfolio-api
sudo chown yashasvi:yashasvi /home/yashasvi/portfolio-api

# Copy backend files from this repo to the server
# From your dev machine:
scp backend/main.py backend/requirements.txt backend/portfolio-api.service backend/.env.example yashasvi@yashasviallen.dynv6.net:/home/yashasvi/portfolio-api/

# On server: set up venv
cd /home/yashasvi/portfolio-api
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Optional: configure Spotify
cp .env.example .env
nano .env   # fill in SPOTIFY_* if you want now-playing

# Install systemd unit
sudo cp portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
sudo systemctl status portfolio-api    # should show "active (running)"
```

Verify the backend is reachable:

```bash
curl http://127.0.0.1:27012/health
# expected: {"ok":true,"ts":"..."}

curl https://yashasviallen.is-a.dev/api/portfolio/health
# same response, but through nginx
```

---

## 3. Frontend deploy

On your dev machine:

```bash
cd my-portfolio
npm install                # only first time, or when deps changed
npm run fetch-repos        # refresh GitHub repo ranking (optional, before each deploy)
npm run build              # outputs to dist/
```

Push to server:

```bash
# Option A: rsync (recommended)
rsync -avz --delete dist/ yashasvi@yashasviallen.dynv6.net:/var/www/yashasviallen.is-a.dev/html/

# Option B: scp + clean
ssh yashasvi@yashasviallen.dynv6.net "sudo rm -rf /var/www/yashasviallen.is-a.dev/html/*"
scp -r dist/* yashasvi@yashasviallen.dynv6.net:/var/www/yashasviallen.is-a.dev/html/

# If permissions are an issue:
ssh yashasvi@yashasviallen.dynv6.net "sudo chown -R www-data:www-data /var/www/yashasviallen.is-a.dev/html/"
```

---

## 4. Verify everything

Open in browser:

| URL                                                   | Should show             |
| ----------------------------------------------------- | ----------------------- |
| `https://yashasviallen.is-a.dev/`                     | Main portfolio          |
| `https://yashasviallen.is-a.dev/uses`                 | What I use page         |
| `https://yashasviallen.is-a.dev/now`                  | Current focus page      |
| `https://yashasviallen.is-a.dev/colophon`             | How site was built      |
| `https://yashasviallen.is-a.dev/console`              | Interactive terminal    |
| `https://yashasviallen.is-a.dev/guestbook`            | Sign the wall           |
| `https://yashasviallen.is-a.dev/nonexistent`          | 404 page                |
| `https://yashasviallen.is-a.dev/api/portfolio/health` | `{"ok":true,...}`       |
| `https://yashasviallen.is-a.dev/api/portfolio/visits` | `{"total":N,"today":M}` |

Existing redirects must still work:

| `https://yashasviallen.is-a.dev/github` | Redirects to GitHub |
| `https://yashasviallen.is-a.dev/linkedin` | Redirects to LinkedIn |
| etc. | |

---

## 5. Troubleshooting

**SPA routes 404 instead of loading the app**
→ The `location /` block with `try_files` is missing or not at the end. Order matters — nginx picks the most specific match, but for non-exact paths it picks the last one written.

**API returns CORS error in browser**
→ Check `ALLOWED_ORIGINS` in `backend/main.py` includes your domain.

**Backend won't start (systemctl status shows failed)**
→ `journalctl -u portfolio-api -n 50` to see logs. Usually `pip install` didn't run inside the venv or the path to `uvicorn` in the service file is wrong.

**Spotify now-playing returns 503**
→ `SPOTIFY_*` env vars not set. The endpoint is optional; the frontend gracefully degrades to a normal Spotify link if it returns errors.

**Page works locally but broken in prod**
→ Check `npm run build` finished without errors, and that you `rsync`'d the entire `dist/` directory (not just `index.html`).
