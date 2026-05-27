# Portfolio Brainstorm & Roadmap

Living doc of ideas that haven't shipped yet. Pick what excites you, ignore the rest.

---

## Hidden / Easter Eggs Already Shipped

- **Konami code** (↑↑↓↓←→←→ba) → brand color swaps to Matrix neon green for 8s + toast
- **Type "matrix"** anywhere → same as Konami
- **Type "rainbow"** → hue-cycle the whole page for 6s
- **DevTools console** → ASCII-art handle + GitHub link + Konami hint (for the curious devs)

Hooks live in `src/components/EasterEggs.tsx` and `src/index.css`.

---

## Additional Hidden Stuff to Add

### Quick wins
- [ ] **Logo click counter** — click `~/yashasvi` 5 times in 3 seconds → confetti + secret achievement toast
- [ ] **URL params** for hidden themes: `?theme=matrix`, `?theme=catppuccin`, `?theme=tokyo`
- [ ] **`?dev=1`** → shows extra debug panels (last fetched data, render counts, mode)
- [ ] **Cursor trails** in matrix mode (canvas particles falling like Matrix rain)
- [ ] **Typed words**: `coffee`, `pizza`, `bug` → fun tiny animations
- [ ] **Right-click context** override on the logo → custom menu with "view source" / "send a wave"

### Bigger ideas
- [ ] **Secret /404 page** with a mini game (snake or tetris in keyboard?)
- [ ] **Hidden `/admin`** that just shows a fake terminal
- [ ] **`/console`** subpage — interactive terminal-style portfolio (type `help`, `whoami`, `projects`)

---

## Themes / Color Schemes to Add

Popular palettes proven to work for dev portfolios. Implement as a theme switcher in nav bar.

| Theme | Background | Accent | Vibe |
|---|---|---|---|
| **Catppuccin Mocha** | `#1e1e2e` | `#cba6f7` (mauve) | Warm dark, beloved by devs |
| **Tokyo Night** | `#1a1b26` | `#7aa2f7` (blue) | Cool dark, neon-leaning |
| **Dracula** | `#282a36` | `#bd93f9` (purple) | Classic dev theme |
| **Nord** | `#2e3440` | `#88c0d0` (cyan) | Cool, minimal, Scandinavian |
| **Rose Pine** | `#191724` | `#ebbcba` (rose) | Soft, aesthetic |
| **Gruvbox Dark** | `#282828` | `#fabd2f` (yellow) | Warm, retro |
| **Solarized Dark** | `#002b36` | `#268bd2` (blue) | High-contrast, technical |
| **Monokai Pro** | `#2d2a2e` | `#ff6188` (red) | Bold, vibrant |

Implementation:
- Add a theme switcher component in nav (icon button → popover with palette swatches)
- Each theme overrides Chakra CSS variables (`--chakra-colors-brand-*`, body bg/fg)
- Persist choice in `localStorage`
- Default to current zinc/indigo

---

## Sections / Pages to Add

### `/uses` page
Tools, hardware, setup. Hugely popular — see uses.tech directory.

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

### `/now` page
[nownownow.com](https://nownownow.com) style — a longer-form version of the hero "NOW" widget.
- What you're focused on this month
- Current reading list
- Open questions you're thinking about
- Updated monthly

### `/colophon` page
How this site was built — stack, design decisions, fonts, deployment.
- Meta + tasteful, signals craft to other devs

### `/guestbook` page
Anonymous or GitHub-OAuth signed messages from visitors.
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

### Keyboard shortcuts modal
- Press `?` → modal showing all shortcuts
- `g h` → go home, `g p` → projects, `g w` → writing, `cmd+k` → command palette
- Common pattern in indie portfolios (lee robinson, paco coursey)

### Command palette (`cmd+k`)
- Searchable jump-to-anything
- Open sections, copy email, view repos
- Use [cmdk](https://cmdk.paco.me) library

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

### Subtle effects
- **Cursor spotlight** — radial gradient that follows the cursor, lights up content
- **Reactive avatar** — hero image tracks cursor position (subtle parallax)
- **Tilt cards** — project cards tilt on hover with 3D transform (vanilla-tilt-style)
- **Animated counter** — stars/repos count up from 0 on first view

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
- [ ] Particle background slows on mobile → throttle FPS or detect device
- [ ] Theme toggle should persist across reloads (currently Chakra defaults to dark each time?)
- [ ] Codeforces API can be slow — add 5s timeout with fallback link
