# Portfolio Brainstorm & Roadmap

Living doc of ideas that haven't shipped yet. Pick what excites you, ignore the rest.

---

## Mini-Games

**Shipped** (`/play` selector → `/play/<slug>`):
- **Snake** (`/play/snake`) — walls = death, snake gradient head→tail, food glow + eat ripple, death flash, length + score + best stats, D-pad + swipe + keyboard. Achievements: snake-played / snake-50 / snake-100.
- **2048** (`/play/2048`) — id-tracked tiles, real slide + merge + spawn animations (framer-motion absolute positioning, two-phase move), win/stuck overlays. Achievements: 2048-played / 2048-1k / 2048-win.
- **Type Race** (`/play/typing`) — dev-quote typing test, live per-char coloring, WPM + accuracy + errors, best WPM saved. Achievements: typing-played / typing-40 / typing-80.

Shared: `src/pages/games/common.ts` (touch detection). Console: `play [game]`, or `snake`/`2048`/`typing` direct.

**Shipped (round 2):**
- [x] **Tech Wordle** (`/play/wordle`) — 50-word dev dictionary, 6 tries, flip animation, on-screen + physical keyboard, win-streak in localStorage. Achievements: wordle-played / wordle-win / wordle-streak.
- [x] **Minesweeper** (`/play/mines`) — 10×10, 15 mines, first-click-safe, flood fill, flag mode toggle + right-click, timer + best, mine counter. Achievements: mines-played / mines-win.
- [x] **Conway's Game of Life** (`/play/life`) — toroidal 50×32 canvas, click/drag to draw, play/pause/step/clear/random, speed slider, presets (glider, pulsar, Gosper gun), gen + pop counters. Achievement: life-played.

**Still candidate:**
- [ ] **Memory / Concentration** — flip cards with tech-stack logos. Easy. Good mobile.
- [ ] **Lights Out** — toggle-grid puzzle. Easy.
- [ ] **Pong / Breakout** — retro canvas paddle. Medium.
- [ ] **Flappy-style** one-button. Medium.

Design principles that worked: big "WAITING TO START" overlay, D-pad for touch + swipe + keyboard all wired, high score in localStorage, score-tier achievements, indigo/zinc theming, motion on score change.

---

## Hidden / Easter Eggs Already Shipped

- **Konami code** (↑↑↓↓←→←→ba) → brand color swaps to Matrix neon green for 8s + toast
- **Type "matrix"** anywhere → same as Konami
- **Type "rainbow"** → hue-cycle the whole page for 6s
- **DevTools console** → ASCII-art handle + GitHub link + Konami hint (for the curious devs)

Hooks live in `src/components/EasterEggs.tsx` and `src/index.css`.

---

## Additional Hidden Stuff — Status

### Quick wins
- [x] **Logo click counter** — 5 clicks in 3s → confetti burst + toast (`Confetti.tsx`, wired in `NavBar.tsx`)
- [x] **URL params** for themes: `?theme=valorant`, `?theme=arcane`, etc. (`themes/palettes.ts → resolveInitialTheme()`)
- [x] **Matrix rain** canvas overlay when Konami is active (`MatrixRain.tsx`, only renders when `body.konami-active`)
- [ ] **`?dev=1`** → debug panel showing fetched data, render counts
- [ ] **More typed words**: `coffee`, `pizza`, `bug` → tiny animations (extend `EasterEggs.tsx → TYPED_TRIGGERS`)
- [ ] **Right-click context** override on logo

### Bigger ideas
- [x] **Custom 404 page** — `NotFoundPage.tsx`. Big 404, "tried: /path" mono breadcrumb, links home + console.
- [x] **`/console`** — full interactive terminal (`ConsolePage.tsx`). Commands: help, about, whoami, projects, skills, journey, contact, blog, cp, now, ls, cat, echo, date, pwd, open, clear, exit, sudo, rm. Tab completion + arrow-key history + Ctrl+L.
- [ ] **Hidden `/admin`** as fake terminal — `/console` already covers it; can add alias route.

---

## Themes — SHIPPED ✓

10 palettes implemented as a theme switcher (palette icon in navbar, next to dark/light toggle).
Files: `src/themes/palettes.ts`, `src/components/ThemeSwitcher.tsx`, CSS in `src/index.css`.
Game/tool-inspired themes (Valorant, Arcane, Pragmata) ship with custom Web Audio cues + cursors via `ThemeFx.tsx`.

| Theme | Status |
|---|---|
| **Indigo** (default) | ✓ |
| **Rosé Pine** | ✓ |
| **Gruvbox** | ✓ |
| **Evergreen** | ✓ |
| **Cyberpunk** | ✓ |
| **Aurora** | ✓ |
| **Amber CRT** | ✓ |
| **Valorant** | ✓ |
| **Arcane** | ✓ |
| **Pragmata** | ✓ |

Features:
- Persists in `localStorage["portfolio-theme"]`
- URL param override: `?theme=valorant`
- Swatches preview each palette in switcher popover
- CSS variable cascade — no Chakra theme rebuild needed
- Smooth `background-color 0.3s` transition between themes
- Also accessible via Command Palette (`cmd+k → switch to ...`)

---

## Sections / Pages to Add

### `/uses` page — SHIPPED ✓
Tools, hardware, setup at `/uses`. Data in `me.ts → uses`.

```
DESK
  - MacBook Pro M2 / ThinkPad / etc.
  - Monitor: ...
  - Keyboard: ...

EDITOR
  - VS Code + extensions list
  - Fonts: JetBrains Mono / Fira Code

DAILY
  - Terminal: kitty / wezterm
  - Browser: Arc / Firefox
  - Notes: Obsidian / Bear

LANGUAGES IN PRACTICE
  - Java for ___
  - Python for ___
  - Rust for learning systems
```

### `/now` page — SHIPPED ✓
Longer-form NOW at `/now`. Data in `me.ts → now`.
- What you're focused on this month
- Current reading list
- Open questions you're thinking about
- Updated monthly

### `/colophon` page — SHIPPED ✓
How this site was built at `/colophon`. Categories: Stack, Design, Backend, Data Source, Interactive Touches, Hosting, Performance.
- Meta + tasteful, signals craft to other devs

### `/guestbook` page — SHIPPED ✓
Visitor messages at `/guestbook`. SQLite backend on FastAPI (`backend/main.py`), proxied via nginx at `/api/portfolio/guestbook`. Rate-limited 5 entries / 60s / IP.
- Backend: Supabase / Firebase / GitHub Issues as DB
- Show last 20 messages with timestamps
- Optional avatar (gravatar / GH)

### `/achievements` timeline
Verifiable milestones with evidence links:
- GSoC 2025 acceptance
- First open source PR merged
- First 100 stars
- CP rating milestones
- Certifications

### `/talks` or `/teaching`
If you give talks, mentor, or write tutorials.

### `/reading` or `/books`
What you're reading + reviews. Pulls from Goodreads / hardcover or static list.

### `/links`
Linktree-style aggregator page. Useful when you put one URL in bios.

### `/stack` (deep version)
Currently you have the tools section in the hero. Deeper version:
- Each tech has its own card with: how long you've used it, primary use, fluency (1-5), example projects
- Sortable / filterable

### `/api` (fun)
A public JSON endpoint of your portfolio data — `yourdomain.dev/api/me.json`. Some devs do this and link it from their site.

---

## Common Portfolio Features Not Yet Added

### Keyboard shortcuts modal — SHIPPED ✓
- Press `?` → modal listing all shortcuts grouped by category (`Shortcuts.tsx → ShortcutsModal`)
- `g h/j/p/a/w` → jump to section (home, journey, projects, activity, writing) — handled by `GNavigator`
- Esc closes modal

### Command palette (`cmd+k`) — SHIPPED ✓
- `cmd+k` / `ctrl+k` → searchable modal (`Shortcuts.tsx → CommandPalette`)
- Commands: jump-to-section, switch theme (8 options), open contacts, trigger easter eggs
- Arrow nav + enter to select
- Live fuzzy filter with keyword matching

### Mobile-first redesign
- Current site is responsive but mobile UX could be better
- Bottom-nav on mobile instead of fixed-right dots
- Hamburger menu for section links on mobile

### Image gallery / photo section
- If you do photography or have project screenshots
- Lightbox on click

### Newsletter signup
- ConvertKit / Buttondown
- "Subscribe for occasional posts" CTA

### Print-friendly CV view
- Add `/cv` route that styles content as a one-page resume
- `@media print` styles
- Generate PDF on the fly

### Visitor counter
- Cute touch — counts visitors, shows in footer
- Use Plausible / Umami / self-hosted

### RSS feed for blog
- Generate `/feed.xml` from blog posts at build time
- Standard `<link rel="alternate">` in HTML head

### Open Graph / social card generation
- Dynamic OG images using Vercel OG (`@vercel/og`)
- Each blog post / section gets its own social preview

### `i18n` toggle
- English / native language toggle
- If you write in multiple languages

### Accessibility audit
- Add proper aria labels everywhere (mostly done)
- Skip-to-content link
- High-contrast theme option
- Focus indicators audit
- Test with screen reader

### Performance
- Code-splitting (current bundle is 600KB+ — should split Chakra/Framer)
- Image lazy loading + WebP
- Lighthouse 100 across the board
- Service worker for offline

### Analytics
- Plausible / Umami (privacy-respecting)
- Track which sections people scroll to, which projects get clicks
- Display in `/dashboard`

---

## Interactive Touches

### Subtle effects — SHIPPED ✓
- [x] **Cursor spotlight** — radial gradient follows cursor, themed per palette via `--cursor-glow` (`CursorSpotlight.tsx`). Auto-disabled on touch + reduced-motion.
- [x] **Tilt cards** — project cards do subtle 3D tilt on hover, 4° max (`hooks/useTilt.ts`, applied to `FetchedRepoCard` + `LegacyProjectCard`)
- [x] **Animated counters** — Stars + External PRs animate from 0 with easeOutQuart (`hooks/useAnimatedNumber.ts`, applied to OSS StatCards)
- [ ] **Reactive avatar** — hero image parallax tracking cursor

### Audio (toggleable, off by default!)
- Soft click on button presses
- Subtle keyboard sound when typing in chat
- Typewriter sound on hero bio
- Always with a clear toggle so it's not annoying

### Live status indicators
- "Currently coding" — pull from WakaTime API
- "Last commit X minutes ago" — pull from GitHub events
- "Listening to" — Spotify (already done!)
- "Reading" — Goodreads
- Combined into a "Live" panel somewhere

### Comments / reactions on blog posts
- GitHub Discussions as comment system (giscus)
- Lightweight, dev-friendly

---

## Performance Watchlist

- Bundle size: currently ~620KB minified, 215KB gzipped. Target <200KB initial JS.
- Chakra UI adds ~150KB — consider migration to native CSS or Stitches later
- Framer Motion is heavy — could be replaced with CSS animations for most cases
- Code-split: dynamic import Activity (heavy, only needed on scroll)
- Lazy-load images (intersection observer)

---

## Ideas Sparked by Other Devs' Sites

Worth studying:
- [leerob.io](https://leerob.io) — minimal, dashboard with live metrics, /uses, /now
- [paco.me](https://paco.me) — extreme minimalism, very specific typography
- [rauno.me](https://rauno.me) — typography-first, micro-interactions
- [linear.app](https://linear.app) — refined dark palette, smooth animations
- [vercel.com](https://vercel.com) — clean, lots of whitespace
- [shadcn.com](https://shadcn.com) — Tailwind master, dark theme done right
- [tholman.com](https://tholman.com) — fun, lots of easter eggs
- [josh.coffee](https://josh.coffee) — terminal-as-portfolio idea

---

## Bug Backlog

- [ ] Activity → OSS tab heatmap fails silently if ghchart.rshah.org is slow → show skeleton instead
- [x] **Particle background mobile** — halved particle count (60 → 30) + frame-skip to ~30 FPS + respects `prefers-reduced-motion`
- [x] **Theme persistence** — saves to `localStorage["portfolio-theme"]`, restores on reload, URL param overrides
- [x] **Codeforces 5s timeout** — `AbortController` with `setTimeout(5000)`, falls back to error state + profile link
