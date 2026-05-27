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

Set a variable for your linux username (used throughout):

```bash
USER_NAME=$USER                    # or set explicitly: USER_NAME=alice
INSTALL_DIR=/home/$USER_NAME/portfolio-api
```

```bash
# 1. Create app directory
sudo mkdir -p "$INSTALL_DIR"
sudo chown "$USER_NAME:$USER_NAME" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 2. Copy backend files from this repo onto the server
#    (run this FROM the dev machine where you have the repo)
# scp backend/main.py backend/get_spotify_token.py backend/requirements.txt \
#     backend/portfolio-api.service backend/.env.example \
#     $USER_NAME@YOUR-SERVER:$INSTALL_DIR/

# 3. Create venv + install deps
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
nano .env    # set ALLOWED_ORIGINS, SPOTIFY_* if used

# 5. Substitute the username into the systemd unit
sed -i "s/__USER__/$USER_NAME/g" portfolio-api.service

# 6. Install + start the service
sudo cp portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
sudo systemctl status portfolio-api    # should show "active (running)"

# 7. Verify
curl http://127.0.0.1:27012/health
# expected: {"ok": true, "ts": "..."}

# 8. (optional) get Spotify refresh token for now-playing
python3 get_spotify_token.py
# follow the prompts, paste the returned token into .env, then:
sudo systemctl restart portfolio-api
```

## Updating

```bash
cd $INSTALL_DIR
# pull latest main.py / edit in place
sudo systemctl restart portfolio-api
```

## Logs

```bash
journalctl -u portfolio-api -f
```

## Database backup

```bash
sqlite3 portfolio.db ".backup portfolio-$(date +%F).db"
```
