"""
Portfolio API · FastAPI · runs on 127.0.0.1:27012, proxied via nginx at /api/portfolio/

Endpoints:
  GET  /guestbook?limit=N    list recent messages
  POST /guestbook            submit a message (name + message)
  GET  /visits               total + today visitor count (auto-increments)
  GET  /spotify/now-playing  proxy Spotify current track (requires .env config)
  GET  /health               liveness check

Storage: SQLite at ./portfolio.db (auto-created on first run).
"""

from datetime import date, datetime
from pathlib import Path
import html as _html
import json
import os
import sqlite3
from typing import AsyncIterator, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# ── Config ───────────────────────────────────────────────────────────────────

DB_PATH = Path(__file__).parent / "portfolio.db"

# Comma-separated list of allowed origins. Set in .env or as env var.
# e.g. ALLOWED_ORIGINS="https://yourdomain.com,http://localhost:5173"
_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
)
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

# Spotify OAuth credentials (set in environment or .env)
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REFRESH_TOKEN = os.getenv("SPOTIFY_REFRESH_TOKEN", "")

# Gemini API for AI chat — get a free key at https://aistudio.google.com/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Naive in-memory rate limit for /chat (IP → list of timestamps)
_chat_rl: dict = {}

# Basic in-memory cache for Spotify (avoid hammering their API)
_spotify_cache = {"data": None, "expires_at": 0.0}

# LeetCode cache (key by username, 5 min TTL)
_lc_cache: dict = {}

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="Portfolio API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS guestbook (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                message TEXT NOT NULL,
                ip TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS visits (
                day TEXT PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                message TEXT NOT NULL,
                ip TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS blog_ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                ip TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(slug, ip)
            );
            CREATE TABLE IF NOT EXISTS blog_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL,
                name TEXT,
                message TEXT NOT NULL,
                reply_to INTEGER,
                is_author INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                ip TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_guestbook_created ON guestbook(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_blog_ratings_slug ON blog_ratings(slug);
            CREATE INDEX IF NOT EXISTS idx_blog_comments_slug ON blog_comments(slug, status);
            """)


init_db()


# ── Models ───────────────────────────────────────────────────────────────────


class GuestEntryIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=500)


class SuggestionIn(BaseModel):
    name: str = Field("anonymous", max_length=64)
    message: str = Field(..., min_length=3, max_length=500)


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: Optional[str] = None


class BlogRatingIn(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class BlogCommentIn(BaseModel):
    name: str = Field("anonymous", max_length=64)
    message: str = Field(..., min_length=2, max_length=1000)
    reply_to: Optional[int] = None


class GuestEntryOut(BaseModel):
    id: int
    name: str
    message: str
    created_at: str


# ── Endpoints ────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"ok": True, "ts": datetime.utcnow().isoformat()}


@app.get("/guestbook", response_model=list[GuestEntryOut])
def list_guestbook(limit: int = 30):
    limit = max(1, min(limit, 100))
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name, message, created_at FROM guestbook "
            "ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/guestbook")
def submit_guestbook(entry: GuestEntryIn, request: Request):
    name = _html.escape(entry.name.strip())
    message = _html.escape(entry.message.strip())
    if not name or not message:
        raise HTTPException(400, "empty")

    # Tiny rate limit: max 5 entries from same IP in last 60s
    ip = request.client.host if request.client else "?"
    with db() as conn:
        recent = conn.execute(
            "SELECT COUNT(*) AS c FROM guestbook "
            "WHERE ip = ? AND created_at > datetime('now', '-60 seconds')",
            (ip,),
        ).fetchone()
        if recent and recent["c"] >= 5:
            raise HTTPException(429, "slow down")
        conn.execute(
            "INSERT INTO guestbook (name, message, ip) VALUES (?, ?, ?)",
            (name, message, ip),
        )
    return {"ok": True}


@app.post("/suggestions")
def submit_suggestion(s: SuggestionIn, request: Request):
    """
    Submit a site suggestion. Write-only from visitors — no public GET.
    Owner reads from SQLite directly. Rate limit: 3 per IP per hour.
    """
    name = _html.escape((s.name or "anonymous").strip()) or "anonymous"
    message = _html.escape(s.message.strip())
    if not message:
        raise HTTPException(400, "empty")

    ip = request.client.host if request.client else "?"
    with db() as conn:
        recent = conn.execute(
            "SELECT COUNT(*) AS c FROM suggestions "
            "WHERE ip = ? AND created_at > datetime('now', '-1 hour')",
            (ip,),
        ).fetchone()
        if recent and recent["c"] >= 3:
            raise HTTPException(429, "slow down")
        conn.execute(
            "INSERT INTO suggestions (name, message, ip) VALUES (?, ?, ?)",
            (name, message, ip),
        )
    return {"ok": True}


@app.get("/visits")
def visits():
    today = date.today().isoformat()
    with db() as conn:
        conn.execute(
            "INSERT INTO visits (day, count) VALUES (?, 1) "
            "ON CONFLICT(day) DO UPDATE SET count = count + 1",
            (today,),
        )
        total = conn.execute("SELECT SUM(count) AS s FROM visits").fetchone()["s"] or 0
        today_count = conn.execute(
            "SELECT count FROM visits WHERE day = ?", (today,)
        ).fetchone()
        today_n = today_count["count"] if today_count else 0
    return {"total": total, "today": today_n}


@app.get("/spotify/now-playing")
async def spotify_now_playing():
    """
    Returns Spotify currently-playing track. Caches for 20s to avoid hammering.
    Requires SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN env vars.
    Response shape matches the frontend's expected format.
    """
    import time

    if not (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN):
        raise HTTPException(503, "spotify not configured")

    now = time.time()
    if _spotify_cache["data"] is not None and now < _spotify_cache["expires_at"]:
        return _spotify_cache["data"]

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Step 1: refresh access token
        token_res = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": SPOTIFY_REFRESH_TOKEN,
            },
            auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
        )
        if token_res.status_code != 200:
            raise HTTPException(502, "spotify token refresh failed")
        access = token_res.json().get("access_token")
        if not access:
            raise HTTPException(502, "spotify token missing")

        # Step 2: fetch currently playing
        cp = await client.get(
            "https://api.spotify.com/v1/me/player/currently-playing",
            headers={"Authorization": f"Bearer {access}"},
        )

        if cp.status_code == 204 or not cp.text:
            # Nothing playing — fetch recently played as fallback
            rp = await client.get(
                "https://api.spotify.com/v1/me/player/recently-played?limit=1",
                headers={"Authorization": f"Bearer {access}"},
            )
            if rp.status_code == 200:
                items = rp.json().get("items", [])
                if items:
                    track = items[0]["track"]
                    out = {
                        "isPlaying": False,
                        "title": track["name"],
                        "artist": ", ".join(a["name"] for a in track["artists"]),
                        "album": track["album"]["name"],
                        "albumImageUrl": (
                            track["album"]["images"][0]["url"]
                            if track["album"]["images"]
                            else None
                        ),
                        "songUrl": track["external_urls"]["spotify"],
                    }
                    _spotify_cache["data"] = out
                    _spotify_cache["expires_at"] = now + 20
                    return out
            return {"isPlaying": False}

        if cp.status_code != 200:
            raise HTTPException(502, "spotify currently-playing failed")

        body = cp.json()
        track = body.get("item")
        if not track:
            return {"isPlaying": False}

        out = {
            "isPlaying": bool(body.get("is_playing")),
            "title": track["name"],
            "artist": ", ".join(a["name"] for a in track["artists"]),
            "album": track["album"]["name"],
            "albumImageUrl": (
                track["album"]["images"][0]["url"] if track["album"]["images"] else None
            ),
            "songUrl": track["external_urls"]["spotify"],
            "context": None,
        }

        # Fetch playback context (playlist / album / artist info)
        ctx = body.get("context")
        if ctx:
            ctx_type = ctx.get("type")
            ctx_url = (ctx.get("external_urls") or {}).get("spotify", "")
            ctx_uri = ctx.get("uri", "")
            ctx_id = ctx_uri.split(":")[-1] if ctx_uri else ""

            if ctx_type == "playlist" and ctx_id:
                try:
                    pl = await client.get(
                        f"https://api.spotify.com/v1/playlists/{ctx_id}?fields=name,owner(display_name)",
                        headers={"Authorization": f"Bearer {access}"},
                    )
                    if pl.status_code == 200:
                        pj = pl.json()
                        out["context"] = {
                            "type": "playlist",
                            "name": pj.get("name", "playlist"),
                            "owner": (pj.get("owner") or {}).get("display_name"),
                            "url": ctx_url,
                        }
                except Exception:
                    pass
            elif ctx_type == "album":
                out["context"] = {
                    "type": "album",
                    "name": track["album"]["name"],
                    "url": ctx_url,
                }
            elif ctx_type == "artist":
                out["context"] = {
                    "type": "artist",
                    "name": track["artists"][0]["name"] if track["artists"] else None,
                    "url": ctx_url,
                }

        _spotify_cache["data"] = out
        _spotify_cache["expires_at"] = now + 20
        return out


@app.get("/leetcode/{username}")
async def leetcode_stats(username: str):
    """
    Proxy LeetCode GraphQL API server-side. Avoids CORS issues and removes
    dependency on dead third-party mirrors. Caches per-user for 5 minutes.
    """
    import time

    key = username.lower().strip()
    if not key:
        raise HTTPException(400, "empty username")

    now = time.time()
    cached = _lc_cache.get(key)
    if cached and now < cached["expires"]:
        return cached["data"]

    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
        }
      }
      allQuestionsCount { difficulty count }
    }
    """

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                "https://leetcode.com/graphql",
                json={"query": query, "variables": {"username": username}},
                headers={
                    "Referer": "https://leetcode.com/",
                    "User-Agent": "Mozilla/5.0 (portfolio-api)",
                    "Content-Type": "application/json",
                },
            )
        except httpx.RequestError as e:
            raise HTTPException(502, f"leetcode unreachable: {e}")

    if resp.status_code != 200:
        raise HTTPException(502, f"leetcode returned {resp.status_code}")

    body = resp.json()
    user = body.get("data", {}).get("matchedUser")
    if not user:
        raise HTTPException(404, "user not found")

    all_counts = {
        q["difficulty"]: q["count"] for q in body["data"]["allQuestionsCount"]
    }
    solved = {
        q["difficulty"]: q["count"]
        for q in user["submitStatsGlobal"]["acSubmissionNum"]
    }
    subs = {
        q["difficulty"]: q["submissions"]
        for q in user["submitStatsGlobal"]["acSubmissionNum"]
    }

    total_solved = solved.get("All", 0)
    total_subs = subs.get("All", 0)

    out = {
        "status": "success",
        "totalSolved": total_solved,
        "totalQuestions": all_counts.get("All", 0),
        "easySolved": solved.get("Easy", 0),
        "totalEasy": all_counts.get("Easy", 0),
        "mediumSolved": solved.get("Medium", 0),
        "totalMedium": all_counts.get("Medium", 0),
        "hardSolved": solved.get("Hard", 0),
        "totalHard": all_counts.get("Hard", 0),
        "ranking": (user.get("profile") or {}).get("ranking") or 0,
        "acceptanceRate": (
            round((total_solved / total_subs * 100), 1) if total_subs > 0 else 0
        ),
    }

    _lc_cache[key] = {"data": out, "expires": now + 300}
    return out


# ── AI Chat (Gemini / Gemma proxy) ───────────────────────────────────────────
async def _gemini_stream(
    messages: list[ChatMessage], model: str
) -> AsyncIterator[bytes]:
    """
    Call Gemini generateContent and emit NDJSON:
    {"content": "..."} then {"done": true}
    """
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )

    system_text = ""
    contents = []

    for m in messages:
        if m.role == "system":
            system_text = m.content
            continue

        role = "user" if m.role == "user" else "model"
        contents.append(
            {
                "role": role,
                "parts": [{"text": m.content}],
            }
        )

    if not contents:
        yield (json.dumps({"error": "no user messages"}) + "\n").encode()
        return

    body = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800,
        },
    }

    if system_text:
        body["systemInstruction"] = {"parts": [{"text": system_text}]}

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(url, headers=headers, json=body)

        if r.status_code != 200:
            err_body = r.text[:800]
            yield (
                json.dumps({"error": f"gemini {r.status_code}: {err_body}"}) + "\n"
            ).encode()
            return

        data = r.json()

        candidates = data.get("candidates") or []
        if not candidates:
            yield (
                json.dumps({"error": f"gemini returned no candidates: {data}"}) + "\n"
            ).encode()
            return

        candidate = candidates[0]
        parts = (candidate.get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts if p.get("text"))

        if not text.strip():
            finish_reason = candidate.get("finishReason")
            safety = candidate.get("safetyRatings")
            prompt_feedback = data.get("promptFeedback")

            yield (
                json.dumps(
                    {
                        "error": "gemini returned empty text",
                        "finishReason": finish_reason,
                        "safetyRatings": safety,
                        "promptFeedback": prompt_feedback,
                    }
                )
                + "\n"
            ).encode()
            return

        yield (json.dumps({"content": text}) + "\n").encode()
        yield (json.dumps({"done": True}) + "\n").encode()

    except httpx.RequestError as e:
        yield (json.dumps({"error": f"gemini unreachable: {e}"}) + "\n").encode()


@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    if not GEMINI_API_KEY:
        raise HTTPException(503, "chat not configured — set GEMINI_API_KEY in .env")

    # Rate limit: 30 chat messages per IP per hour, simple in-memory
    import time

    ip = request.client.host if request.client else "?"
    now = time.time()
    bucket = _chat_rl.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < 3600]
    if len(bucket) >= 30:
        raise HTTPException(429, "rate limit: 30 messages per hour")
    bucket.append(now)

    # Validate length
    total = sum(len(m.content) for m in req.messages)
    if total > 16000:
        raise HTTPException(413, "context too long")

    model = req.model or GEMINI_MODEL

    return StreamingResponse(
        _gemini_stream(req.messages, model),
        media_type="application/x-ndjson",
    )


# ── Blog ratings + comments ──────────────────────────────────────────────────


def _slug_ok(slug: str) -> bool:
    return (
        bool(slug) and len(slug) <= 120 and all(c.isalnum() or c in "-_" for c in slug)
    )


@app.get("/blog/{slug}/stats")
def blog_stats(slug: str):
    if not _slug_ok(slug):
        raise HTTPException(400, "bad slug")
    with db() as conn:
        r = conn.execute(
            "SELECT COUNT(*) AS c, AVG(rating) AS a FROM blog_ratings WHERE slug = ?",
            (slug,),
        ).fetchone()
        comment_count = conn.execute(
            "SELECT COUNT(*) AS c FROM blog_comments WHERE slug = ? AND status = 'approved'",
            (slug,),
        ).fetchone()
    return {
        "count": r["c"] or 0,
        "average": round(r["a"], 2) if r["a"] is not None else None,
        "comments": comment_count["c"] or 0,
    }


@app.post("/blog/{slug}/rate")
def blog_rate(slug: str, body: BlogRatingIn, request: Request):
    if not _slug_ok(slug):
        raise HTTPException(400, "bad slug")
    ip = request.client.host if request.client else "?"
    with db() as conn:
        # One vote per IP per slug — overwrite if exists
        conn.execute(
            "INSERT INTO blog_ratings (slug, rating, ip) VALUES (?, ?, ?) "
            "ON CONFLICT(slug, ip) DO UPDATE SET rating = excluded.rating, "
            "created_at = CURRENT_TIMESTAMP",
            (slug, body.rating, ip),
        )
    return {"ok": True}


@app.get("/blog/{slug}/comments")
def blog_comments_list(slug: str, limit: int = 100):
    if not _slug_ok(slug):
        raise HTTPException(400, "bad slug")
    limit = max(1, min(limit, 200))
    with db() as conn:
        rows = conn.execute(
            "SELECT id, name, message, reply_to, is_author, created_at "
            "FROM blog_comments "
            "WHERE slug = ? AND status = 'approved' "
            "ORDER BY id ASC LIMIT ?",
            (slug, limit),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "message": r["message"],
            "reply_to": r["reply_to"],
            "is_author": bool(r["is_author"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]


@app.post("/blog/{slug}/comments")
def blog_comment_submit(slug: str, body: BlogCommentIn, request: Request):
    if not _slug_ok(slug):
        raise HTTPException(400, "bad slug")
    name = _html.escape((body.name or "anonymous").strip()) or "anonymous"
    message = _html.escape(body.message.strip())
    if not message:
        raise HTTPException(400, "empty")

    ip = request.client.host if request.client else "?"
    with db() as conn:
        # Rate limit: 5 comments per IP per slug per hour
        recent = conn.execute(
            "SELECT COUNT(*) AS c FROM blog_comments "
            "WHERE ip = ? AND slug = ? AND created_at > datetime('now', '-1 hour')",
            (ip, slug),
        ).fetchone()
        if recent and recent["c"] >= 5:
            raise HTTPException(429, "slow down")

        # Validate reply_to belongs to same slug
        reply_to = body.reply_to
        if reply_to is not None:
            parent = conn.execute(
                "SELECT id FROM blog_comments WHERE id = ? AND slug = ?",
                (reply_to, slug),
            ).fetchone()
            if not parent:
                reply_to = None

        conn.execute(
            "INSERT INTO blog_comments (slug, name, message, reply_to, status, ip) "
            "VALUES (?, ?, ?, ?, 'pending', ?)",
            (slug, name, message, reply_to, ip),
        )
    return {"ok": True}


@app.get("/chat/status")
def chat_status():
    """Returns whether chat is configured + which model is in use."""
    return {
        "available": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL if GEMINI_API_KEY else None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=27012)
