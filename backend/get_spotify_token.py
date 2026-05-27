#!/usr/bin/env python3
"""
One-shot Spotify refresh-token helper.

Requirements:
  - backend/.env has SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET set
  - The redirect URI http://127.0.0.1:8000/callback is registered in your
    Spotify Developer Dashboard for this app

Usage:
  cd backend
  python3 get_spotify_token.py

Steps it walks you through:
  1. Opens (or prints) an authorize URL
  2. You authorize in browser → Spotify redirects to 127.0.0.1:8000/callback?code=...
  3. The callback URL will show a connection error (nothing listening on 8000) — that's fine
  4. You paste either the full callback URL or just the code value
  5. Script exchanges the code for a refresh token and prints it
  6. You paste the token into .env under SPOTIFY_REFRESH_TOKEN

Uses stdlib only — no extra deps needed.
"""

import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# ── Load .env if present ─────────────────────────────────────────────────────
ENV_FILE = Path(__file__).parent / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "").strip()
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8000/callback").strip()
SCOPES = "user-read-currently-playing user-read-recently-played"

# ── Sanity check ─────────────────────────────────────────────────────────────
if not CLIENT_ID or not CLIENT_SECRET:
    print("ERROR: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env")
    print(f"       (looked at: {ENV_FILE})")
    sys.exit(1)

# ── Step 1: build authorize URL ──────────────────────────────────────────────
params = {
    "client_id": CLIENT_ID,
    "response_type": "code",
    "redirect_uri": REDIRECT_URI,
    "scope": SCOPES,
    "show_dialog": "true",
}
authorize_url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)

print()
print("=" * 72)
print("  STEP 1: open this URL in a browser logged into your Spotify account")
print("=" * 72)
print()
print(authorize_url)
print()
print("=" * 72)
print(f"  STEP 2: authorize → Spotify redirects to {REDIRECT_URI}?code=...")
print()
print("           Browser will show a 'site can't be reached' error.")
print("           That's expected (nothing's listening on 8000).")
print("           Look at the URL bar — copy the entire URL OR just the")
print("           value after ?code=")
print("=" * 72)
print()

raw = input("STEP 3: paste the URL (or just the code): ").strip()

# Extract code from full URL if given
if raw.startswith("http"):
    parsed = urllib.parse.urlparse(raw)
    code = urllib.parse.parse_qs(parsed.query).get("code", [""])[0]
else:
    code = raw

if not code:
    print("ERROR: no code provided.")
    sys.exit(1)

# ── Step 2: exchange code for tokens ─────────────────────────────────────────
auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
body = urllib.parse.urlencode({
    "grant_type": "authorization_code",
    "code": code,
    "redirect_uri": REDIRECT_URI,
}).encode()

req = urllib.request.Request(
    "https://accounts.spotify.com/api/token",
    data=body,
    headers={
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded",
    },
)

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"ERROR: token exchange failed (HTTP {e.code})")
    print(e.read().decode())
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

refresh = data.get("refresh_token")
if not refresh:
    print("ERROR: no refresh_token in response")
    print(json.dumps(data, indent=2))
    sys.exit(1)

# ── Success ──────────────────────────────────────────────────────────────────
print()
print("=" * 72)
print("  ✓ SUCCESS")
print("=" * 72)
print()
print("  Refresh token:")
print()
print(f"  {refresh}")
print()
print("  Add this line to backend/.env:")
print()
print(f"    SPOTIFY_REFRESH_TOKEN={refresh}")
print()
print("  Then restart the service:")
print("    sudo systemctl restart portfolio-api")
print()
print("  Verify it works:")
print("    curl http://127.0.0.1:27012/spotify/now-playing")
print("    # or, behind nginx: https://YOUR-DOMAIN/api/portfolio/spotify/now-playing")
print()
