# Portfolio

A personal portfolio template built with React, TypeScript, and Vite. All content lives in one file (`src/data/me.ts`), so you fill in your details and never touch component code.

### Hero

![Hero](./screenshots/demo1.png)

One scrolling page, six sections. A right-side dot navigator (desktop) and a sticky top nav both jump between them.

Avatar, an animated typing bio, and role tags. A live **Now** card highlights what you are currently working on. Below it, your stack: primary languages as pills (first one starred), then frameworks and tools grouped side by side into **Frontend**, **Backend**, **Data**, and **Tools**. Unrecognized tools show their name without a placeholder icon.

### My Journey

![Journey](./screenshots/demo2.png)

A vertical timeline of roles and milestones. Each entry is dated and can carry "evidence" links that back up the claim (repos, demos, write-ups).

### What I've Built

![Projects](./screenshots/demo3.png)

Pinned flagship work sits on top, marked with a star accent. Below it, a grid auto-ranked from your GitHub by stars, recency, and topics. Cards show language, stars/forks, and links to repo and live demo. You can also merge hand-written projects into the ranked grid.

### Beyond Projects

![Activity](./screenshots/demo4.png)

Tabbed activity:

- **competitive** - live Codeforces and LeetCode stats via public APIs, with graceful fallback if an API is slow or down
- **open source** - recent contributions from the GitHub Events API
- **what i follow** - accounts and projects you keep up with

### Notes & Posts

![Writing](./screenshots/demo5.png)

An inline blog. Posts expand in place with tags, references, and a comment link, so there is no external CMS to run.

![More posts](./screenshots/demo6.png)

The footer carries a `⌘K` command-palette hint, a guestbook link, a console prompt, and a live clock.

## Features

- Particle constellation background with mouse parallax, plus a cursor spotlight
- 10 color themes; several add audio-visual effects, the four minimal ones also support light mode
- Command palette (`⌘K`), keyboard navigation (`g` then a section key), and a `?` shortcuts modal
- Console page, mini-games (`/play`), guestbook, and hidden achievements
- Easter eggs: Konami code, matrix rain, rainbow mode, logo-click confetti
- AI chat widget backed by the Gemini API, proxied server-side and primed on your `me.ts`
- Responsive and mobile-friendly; respects `prefers-reduced-motion`

## Quick Start

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
cp src/data/me.example.ts src/data/me.ts   # then edit me.ts
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

`me.ts` is the single source of truth: name, bio, journey, projects, blog posts, contacts, and theme defaults. Project repos are auto-fetched and scored from GitHub with `npm run fetch-repos`.

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

## Themes

Ten palettes ship by default. Switch from the nav, deep-link with `?theme=<key>`, or pick one from the command palette. The choice is saved to `localStorage`.

### Requesting a theme

Open a GitHub issue with:

- a name and a one-line vibe (and any inspiration: an editor theme, a game, a site)
- three hex colors: a background and two accents
- optional: whether it should support light mode or audio-visual effects

That is enough for a maintainer to build it.

### Adding a theme

The minimum is two files, both keyed by the same lowercase `key`.

1. `src/themes/palettes.ts` - add an entry to `THEMES`:

```ts
{
  key: "mytheme",            // unique slug, referenced everywhere
  name: "My Theme",
  desc: "Short one-line vibe",
  swatch: ["#0b0b0f", "#ff7a59", "#ffd36e"], // [bg, accent1, accent2] for the switcher preview
}
```

2. `src/index.css` - add a matching block with the same slug:

```css
body[data-theme="mytheme"] {
  background-color: #0b0b0f !important;
  background-image: radial-gradient(ellipse at 50% 0%, #15151f 0%, #060608 70%) !important;
  --chakra-colors-brand-300: #ffd36e;
  --chakra-colors-brand-400: #ff7a59;   /* primary accent, used the most */
  --chakra-colors-brand-500: #e0563b;
  --chakra-colors-brand-600: #c0432c;
  --cursor-glow: rgba(255, 122, 89, 0.12);
}
```

The `brand-300..600` vars retint every accent across the site; `--cursor-glow` colors the cursor spotlight. That is all a theme needs - the switcher and command palette read `THEMES` directly, so it appears automatically.

#### Optional: light mode

Add the key to `MINIMAL_THEMES` in `palettes.ts`, then add a light override in `index.css` (higher specificity wins over the dark block):

```css
body[data-theme="mytheme"][data-mode="light"] {
  background-color: #faf7f0 !important;
  background-image: radial-gradient(ellipse at 50% 0%, #fffdf8 0%, #efe9dd 70%) !important;
  --chakra-colors-brand-400: #c0432c;   /* darker accents for contrast on a light bg */
  /* ...brand-300/500/600, --cursor-glow */
}
```

Only themes listed in `MINIMAL_THEMES` show the light/dark toggle; the rest are dark-only.

#### Optional: audio-visual effects

Write a `SetupFn` and register it under the same key in `THEME_FX` (`src/components/ThemeFx.tsx`). A `SetupFn` receives an audio-context getter and returns a cleanup function. Tag any DOM you inject with `data-themefx="1"` so it is removed on theme change. Skip this for a plain theme.

### Where themes are referenced

| File | Role |
|------|------|
| `src/themes/palettes.ts` | Source of truth: `THEMES`, `DEFAULT_THEME`, `MINIMAL_THEMES`, `isMinimalTheme`, `applyTheme`, `resolveInitialTheme` |
| `src/index.css` | `body[data-theme="<key>"]` colors, optional `[data-mode="light"]` overrides, and `fx-*` keyframes |
| `src/components/ThemeFx.tsx` | `THEME_FX` registry of optional per-theme effects |
| `src/components/ThemeSwitcher.tsx` | Renders the palette grid from `THEMES` (no edits needed) |
| `src/components/Shortcuts.tsx` | Adds one command-palette entry per theme (no edits needed) |
| `src/components/NavBar.tsx`, `src/components/ColorModeSync.tsx` | Gate light mode via `isMinimalTheme` |
| `src/pages/ColophonPage.tsx` | Prose list of themes - update by hand |

`applyTheme(key)` sets `document.body.dataset.theme`, persists to `localStorage`, and dispatches a `themechange` event that `ThemeFx`, the nav, and `ColorModeSync` listen for.

## License

[MIT](LICENSE)
