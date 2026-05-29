# Portfolio

A personal portfolio template built with React, TypeScript, and Vite. All content lives in one file, so there is no component code to touch.

![Portfolio Screenshot](./screenshots/demo.png)

## Features

- Particle constellation background with mouse parallax
- Animated hero: typing effect, tags, scroll cue
- Currently Building: live indicator for what you are working on
- Competitive programming stats: live Codeforces and LeetCode via public APIs
- Projects grid auto-ranked from your GitHub, with manual pins
- Experience and journey timeline sections
- Inline blog with expandable posts (no external service)
- AI chat widget: Gemini API, proxied server-side, primed on your portfolio
- 10 color themes, several with audio-visual effects
- Console page, mini-games, guestbook, hidden achievements
- Dark and light mode, responsive, mobile-friendly

## Quick Start

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
cp src/data/me.example.ts src/data/me.ts   # then edit me.ts
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The FastAPI backend (guestbook, visitor count, Spotify proxy, AI chat) is optional. Without it, those features fall back gracefully. See [`backend/README.md`](backend/README.md) to deploy, and [`DEPLOY.md`](DEPLOY.md) for full production setup (nginx + systemd).

## AI Chat (optional)

A floating widget calls the backend at `/api/portfolio/chat`, which proxies the Gemini API. The key stays server-side. The system prompt is built from `me.ts`.

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `backend/.env`:

```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash   # default, works on all free-tier keys
```

3. Restart: `sudo systemctl restart portfolio-api`

If the key is missing, the chat button shows offline and the rest of the site works normally. Model options and rate limits live in [`backend/README.md`](backend/README.md).

## Spotify Now Playing (optional)

Set `nowPlayingApi` on the Spotify contact in `me.ts` to a deployed [spotify-github-profile](https://github.com/kittinan/spotify-github-profile) endpoint. The badge then shows a live now-playing popover; without it, it stays a plain link.

## Project Structure

```
src/
  components/   UI sections and widgets
  pages/        Routed pages (console, play, guestbook, ...) + games/
  data/         me.ts (your content) and me.example.ts (template)
  themes/       Theme palettes
  services/     Tech and social icon mapping
  lib/          Achievements and helpers
  hooks/        Custom hooks
  App.tsx       Routes and layout
  theme.ts      Chakra theme
  index.css     Global styles and per-theme variables
```

## Deployment

```bash
npm run build   # outputs to dist/
```

Deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages). The optional backend deploys separately.

## License

[MIT](LICENSE)
