# Portfolio

A personal portfolio template built with React, TypeScript, and Vite. All content lives in a single file — no component code to touch.

![Portfolio Screenshot](./screenshots/demo.png)

## Features

- Particle constellation background
- Animated hero with typing effect, tags, and scroll cue
- **Currently Building** — live indicator for what you're working on now
- **Competitive Programming** — live Codeforces + LeetCode stats via public APIs
- **Blog** — inline expandable posts, no external service needed
- **AI Chat** — floating widget powered by Gemma 3 (Gemini API, proxied server-side) that knows your portfolio
- Timeline journey section
- Projects grid with tech badges
- Section navigator dots
- Dark / light mode toggle
- Responsive, mobile-friendly

## Tech Stack

| | |
|---|---|
| Framework | [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite](https://vitejs.dev/) |
| UI | [Chakra UI v2](https://chakra-ui.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [React Icons](https://react-icons.github.io/react-icons/) |
| Fonts | Inter + JetBrains Mono (Google Fonts) |

## Quick Start

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
cp src/data/me.example.ts src/data/me.ts
# Edit src/data/me.ts with your details
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend (FastAPI · guestbook + visitor count + Spotify proxy) is optional. Without it, the guestbook page shows an offline message and the Spotify badge falls back to a plain link. See [`backend/README.md`](backend/README.md) to deploy.

For full production deployment (nginx + systemd + frontend + backend), see [`DEPLOY.md`](DEPLOY.md).

## Easter Eggs

The site has hidden interactions for visitors who poke around. The full list is intentionally undocumented — start with `?` and `⌘K`, then go from there. Track your finds:

```bash
# In the /console page, type:
achievements
```

Or visit `/console` directly and explore.

## Customization

Everything is in `src/data/me.ts`. The file is well-commented — copy from `me.example.ts` and fill in your details.

### Core fields

| Field | Description |
|---|---|
| `name` | Full name — used in title, footer, navbar, and AI chat |
| `image` | Direct URL to your profile photo |
| `tags` | Short descriptors shown as pills in the hero |
| `languages` | Programming languages — auto-mapped to icons |
| `frameworks` | Categorized tools: `frontend`, `backend`, `databases`, `misc` |
| `desc_brief` | One-sentence bio (shown by default) |
| `desc` | Full bio (revealed on "show more") |
| `contacts` | Social links — `id` maps to icon (`github`, `linkedin`, `twitter`, `spotify`, etc.) |
| `journey` | Timeline entries: `title`, `company`, `date`, `description` |
| `projects` | Projects: `name`, `description`, `links[]`, `skills[]` |

### New fields

#### `cp` — Competitive Programming

```ts
cp: {
  codeforces: "your_handle",  // fetches live from codeforces.com/api
  leetcode: "your_handle",    // fetches live from leetcode-stats-api.herokuapp.com
},
```

Leave as empty string `""` to show a graceful fallback link instead of stats.

#### `currentWork` — Currently Building

```ts
currentWork: {
  title: "Project Name",
  org: "Organization",
  orgUrl: "https://github.com/org/project",
  description: "What you're building and why.",
  links: [{ name: "Repository", link: "https://..." }],
  tags: ["C#", "WPF"],
  startDate: "May 2025",
},
```

#### `blogs` — Writing

```ts
blogs: [
  {
    title: "Post Title",
    date: "Month Year",
    readTime: "5 min read",
    excerpt: "Hook sentence shown on the card.",
    tags: ["Tag1", "Tag2"],
    // For inline content (expands in page):
    content: `Full post text here.`,
    // OR for external link (opens in new tab):
    link: "https://dev.to/you/post",
  },
],
```

### AI Chat (Gemini API)

Floating robot button hits FastAPI backend at `/api/portfolio/chat`, which proxies Google's Gemini API. API key stays server-side — never exposed to the browser. System prompt is auto-built from `me.ts` data.

**Setup:**

1. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Add to `backend/.env`:

```bash
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash   # default — works on all free-tier keys
```

3. Restart backend:

```bash
sudo systemctl restart portfolio-api
```

**Model options** (set via `GEMINI_MODEL`):

| Model | Notes |
|---|---|
| `gemini-2.0-flash` | **Default** — current free-tier, fast streaming |
| `gemini-1.5-flash` | Older but rock-solid |
| `gemini-2.5-flash` | Newer (requires API access) |
| `gemma-2-9b-it` | Gemma 2 9B (requires Gemma access on key) |
| `gemma-2-27b-it` | Larger Gemma (requires access) |
| `gemma-3-1b-it` / `4b-it` | Smaller Gemma 3 (availability varies) |

> **Note**: not all Gemma models are exposed via v1beta for every API key. If you hit a 404, fall back to `gemini-2.0-flash` — universally available.

**Rate limiting**: 30 messages per visitor IP per hour (tweak in `backend/main.py`).

**Verify:**
```bash
curl https://yourdomain.com/api/portfolio/chat/status
# {"available": true, "model": "gemini-2.0-flash"}
```

If `available: false` → backend missing `GEMINI_API_KEY`. Chat FAB shows offline gracefully.

### Spotify Now Playing (optional)

The Spotify badge in the navbar can show a live now-playing popover with album art, track name, and animated equalizer bars.

**Setup:**

1. Fork [kittinan/spotify-github-profile](https://github.com/kittinan/spotify-github-profile)
2. Deploy on Vercel (free), complete the Spotify OAuth flow once
3. Paste the resulting API URL into `me.ts`:

```ts
{
  id: "spotify",
  name: "Spotify",
  site: "https://open.spotify.com/",
  link: "https://your-spotify-link",
  nowPlayingApi: "https://your-vercel-app.vercel.app/api/spotify",
},
```

Without `nowPlayingApi`, the badge stays as a normal link. With it: a pulsing green dot appears when you're playing, and clicking opens a mini-player.

## Project Structure

```
my-portfolio/
├── src/
│   ├── components/
│   │   ├── Intro.tsx              # Hero section
│   │   ├── CurrentlyBuilding.tsx  # "Now" section
│   │   ├── CPStats.tsx            # Codeforces + LeetCode
│   │   ├── Journey.tsx            # Timeline
│   │   ├── Projects.tsx           # Projects grid
│   │   ├── Blog.tsx               # Inline blog posts
│   │   ├── AiChat.tsx             # AI chat widget (Gemini proxy)
│   │   ├── ParticleBackground.tsx # Canvas constellation
│   │   ├── NavBar.tsx             # Sticky nav with section links
│   │   ├── SectionNavigator.tsx   # Dot nav (desktop)
│   │   ├── Footer.tsx
│   │   ├── ContactBadges.tsx
│   │   └── ColorModeToggle.tsx
│   ├── data/
│   │   ├── me.ts          # Your content (gitignored if you fork)
│   │   └── me.example.ts  # Template
│   ├── services/
│   │   ├── getTechIcon.ts       # Tech name → React Icon
│   │   └── favicon-site-url.ts  # Social id → React Icon
│   ├── App.tsx    # Layout + section wiring
│   ├── theme.ts   # Chakra UI theme (colors, fonts, animations)
│   └── index.css  # Scrollbar, fonts, scroll-behavior
├── index.html
└── vite.config.ts
```

## Deployment

```bash
npm run build   # outputs to dist/
```

Deploy the `dist/` folder to any static host: Vercel, Netlify, GitHub Pages, Cloudflare Pages.

> **Note:** AI chat requires `GEMINI_API_KEY` set in the backend `.env`. Without it, the chat FAB shows as offline but the rest of the site works normally.

## License

[MIT](LICENSE)
