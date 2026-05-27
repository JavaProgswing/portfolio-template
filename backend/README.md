# Portfolio API

FastAPI service backing the portfolio's interactive features:

| Endpoint                          | Purpose                                    |
| --------------------------------- | ------------------------------------------ |
| `GET  /health`                    | Liveness check                             |
| `GET  /guestbook?limit=N`         | List recent messages                       |
| `POST /guestbook`                 | Submit a message (rate-limited: 5/min/IP) |
| `GET  /visits`                    | Increment + return total & today count    |
| `GET  /spotify/now-playing`       | Spotify currently-playing (optional)      |

Storage: SQLite at `./portfolio.db` (auto-created).

## Deployment on Ubuntu

```bash
# 1. Clone the repo (or copy just the backend/ dir) onto the server
sudo mkdir -p /home/yashasvi/portfolio-api
sudo chown yashasvi:yashasvi /home/yashasvi/portfolio-api
cd /home/yashasvi/portfolio-api

# Copy main.py, requirements.txt, portfolio-api.service, .env.example here
# (e.g. via scp from your dev machine, or git clone if you push backend to a separate repo)

# 2. Create venv + install
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# 3. Configure environment (only needed if you want Spotify now-playing)
cp .env.example .env
# Edit .env and fill in SPOTIFY_* if desired

# 4. Test it manually
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 27012
# Hit http://127.0.0.1:27012/health from another terminal — should return {"ok": true, ...}
# Ctrl+C to stop

# 5. Install systemd service
sudo cp portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
sudo systemctl status portfolio-api    # verify it's running

# 6. Logs (live tail)
journalctl -u portfolio-api -f
```

## Updating

```bash
cd /home/yashasvi/portfolio-api
# pull latest main.py / edit in place
sudo systemctl restart portfolio-api
```

## Database backup

```bash
sqlite3 portfolio.db ".backup portfolio-$(date +%F).db"
```
