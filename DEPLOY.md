# Deployment Guide

Two pieces:

1. **Frontend** — React build → nginx html root
2. **Backend** — FastAPI service → `127.0.0.1:27012`, proxied via nginx

---

## 0. Set your variables

Used throughout the rest of this guide. Adjust to match your setup:

```bash
DOMAIN=yourdomain.com                           # the domain serving the site
SERVER=user@your-server.example.com             # ssh target
HTML_DIR=/var/www/$DOMAIN/html                  # nginx root for static files
USER_NAME=$USER                                 # linux user owning portfolio-api
```

---

## 1. nginx config

Open the site config:

```bash
sudo nano /etc/nginx/sites-available/$DOMAIN.conf
```

Inside the existing `server { ... }` block, add:

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

    # ── SPA fallback ────────────────────────────────────────────────────
    # Any request that didn't match a redirect, proxy, or static file
    # falls through to index.html so React Router can handle it.
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
```

Test + reload:

```bash
sudo nginx -t                  # syntax check
sudo systemctl reload nginx
```

> **Note on order**: nginx prefix-matching uses longest-match-wins, NOT declaration order. You can place these blocks anywhere in the `server` block. Order only matters for regex `location ~` blocks.

---

## 2. Backend setup

```bash
# On the server
INSTALL_DIR=/home/$USER_NAME/portfolio-api
sudo mkdir -p $INSTALL_DIR
sudo chown $USER_NAME:$USER_NAME $INSTALL_DIR
```

From your dev machine:

```bash
scp backend/main.py backend/get_spotify_token.py backend/requirements.txt \
    backend/portfolio-api.service backend/.env.example \
    $SERVER:/home/$USER_NAME/portfolio-api/
```

Back on the server:

```bash
cd /home/$USER_NAME/portfolio-api
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# Configure
cp .env.example .env
nano .env                          # set ALLOWED_ORIGINS=https://$DOMAIN
                                    # also SPOTIFY_* if you want now-playing

# Substitute your linux username into the systemd unit
sed -i "s/__USER__/$USER_NAME/g" portfolio-api.service

sudo cp portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
sudo systemctl status portfolio-api    # active (running)
```

Verify:

```bash
curl http://127.0.0.1:27012/health
# {"ok":true,"ts":"..."}

curl https://$DOMAIN/api/portfolio/health
# same, via nginx
```

---

## 3. Frontend build + deploy

On your dev machine:

```bash
cd my-portfolio

# First-time deps
npm install

# (optional) refresh GitHub repo ranking — runs the scoring algorithm
npm run fetch-repos

# Build
npm run build
```

Push to server. **CRITICAL**: trailing slash on `dist/` so contents (not the dir itself) upload. Force-readable perms so nginx can serve:

```bash
rsync -avz --delete \
  --chmod=D755,F644 \
  dist/ $SERVER:$HTML_DIR/
```

If you skipped `--chmod`, fix perms after:

```bash
ssh $SERVER "sudo chmod -R a+rX $HTML_DIR"
```

---

## 4. Deploy script (recommended)

Save this as `scripts/deploy.sh` so you don't have to remember the flags:

```bash
#!/usr/bin/env bash
set -e

DOMAIN=${DOMAIN:?set DOMAIN env var}
SERVER=${SERVER:?set SERVER env var}
HTML_DIR=${HTML_DIR:-/var/www/$DOMAIN/html}

echo "→ building…"
npm run build

echo "→ syncing to $SERVER:$HTML_DIR…"
rsync -avz --delete --chmod=D755,F644 dist/ "$SERVER:$HTML_DIR/"

echo "→ ✓ deployed to https://$DOMAIN"
```

Run with:

```bash
DOMAIN=yourdomain.com SERVER=user@your-server ./scripts/deploy.sh
```

Or `chmod +x scripts/deploy.sh` and export those vars to your shell rc.

---

## 5. Verify

| URL                                       | Expected           |
| ----------------------------------------- | ------------------ |
| `https://$DOMAIN/`                        | Home               |
| `https://$DOMAIN/uses`                    | Uses page          |
| `https://$DOMAIN/now`                     | Now page           |
| `https://$DOMAIN/colophon`                | Colophon           |
| `https://$DOMAIN/console`                 | Terminal           |
| `https://$DOMAIN/guestbook`               | Guestbook          |
| `https://$DOMAIN/random-404`              | 404 page           |
| `https://$DOMAIN/api/portfolio/health`    | `{"ok":true,...}`  |
| `https://$DOMAIN/api/portfolio/visits`    | `{"total":N,...}`  |

---

## 6. Troubleshooting

**SPA routes 404**
→ The `location /` block with `try_files` is missing. Add it back.

**Assets return 404**
→ Permissions. nginx (`www-data`) must read the files. Check with:
```bash
namei -l $HTML_DIR/assets/index-<hash>.js
ls -la $HTML_DIR/assets/
# Fix: sudo chmod -R a+rX $HTML_DIR
```

**Assets return 403**
→ Directory has `drwx------`. Run the chmod above.

**API returns CORS error**
→ `ALLOWED_ORIGINS` in backend `.env` doesn't include your domain. Fix and restart: `sudo systemctl restart portfolio-api`.

**Backend won't start**
→ `journalctl -u portfolio-api -n 50` shows the error. Common causes:
- venv path wrong (check the `__USER__` substitution actually ran)
- `pip install` didn't complete
- Port 27012 already in use

**Spotify now-playing returns 503**
→ `SPOTIFY_*` env vars not set. The endpoint is optional; the frontend gracefully degrades to a normal link.

**Page works on direct hit but stale via Cloudflare**
→ Purge Cloudflare cache (dashboard → Caching → Purge Everything). Asset URLs are hash-based so they self-bust, but `index.html` itself may be cached. The `Cache-Control: no-cache` header on the `location /` block tells CF not to cache it, but purge anyway after deploy.
