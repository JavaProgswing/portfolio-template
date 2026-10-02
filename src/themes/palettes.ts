// Theme palettes, applied at runtime via document.body.dataset.theme = key.
// Matching CSS variables live in src/index.css under body[data-theme="X"].

export interface ThemePalette {
  key: string;
  name: string;
  desc: string;
  // three colors for the swatch preview in the switcher
  swatch: [string, string, string];
  /** What the theme does beyond colour: click sounds, ambient visuals, full immersive set. */
  fx: { sound: boolean; ambient: boolean; immersive?: boolean };
}

/** Themes beyond this index (in THEMES order) are the immersive FX group. */

export const THEMES: ThemePalette[] = [
  // Minimal themes (no immersive FX)
  {
    key: "indigo",
    name: "Indigo",
    desc: "Calm, clean, stays out of the way",
    swatch: ["#09090b", "#818cf8", "#a5b4fc"],
    fx: { sound: true, ambient: false },
  },
  {
    key: "rosepine",
    name: "Rosé Pine",
    desc: "Soft and cozy, easy on the eyes",
    swatch: ["#191724", "#ebbcba", "#c4a7e7"],
    fx: { sound: true, ambient: true },
  },
  {
    key: "gruvbox",
    name: "Gruvbox",
    desc: "Warm retro hacker comfort",
    swatch: ["#282828", "#fabd2f", "#fe8019"],
    fx: { sound: true, ambient: false },
  },
  {
    key: "evergreen",
    name: "Evergreen",
    desc: "Quiet forest stillness",
    swatch: ["#1a1f16", "#86efac", "#4ade80"],
    fx: { sound: true, ambient: true },
  },
  {
    key: "crimson",
    name: "Crimson",
    desc: "Black and signal red, no mercy",
    swatch: ["#0d0708", "#f87171", "#ef4444"],
    fx: { sound: true, ambient: true },
  },
  {
    key: "solarized",
    name: "Solarized",
    desc: "Precision-tuned, easy contrast",
    swatch: ["#002b36", "#b58900", "#2aa198"],
    fx: { sound: true, ambient: false },
  },
  {
    key: "sunset",
    name: "Sunset",
    desc: "Dusk gradient, coral to violet",
    swatch: ["#1a0f1f", "#ff7a59", "#c77dff"],
    fx: { sound: true, ambient: true },
  },
  {
    key: "mono",
    name: "Mono",
    desc: "Pure ink and paper, no colour",
    swatch: ["#0a0a0a", "#fafafa", "#d4d4d4"],
    fx: { sound: true, ambient: false },
  },
  // Immersive FX themes
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    desc: "Neon dystopia, loud and alive",
    swatch: ["#0a0a0f", "#fcee0a", "#00f0ff"],
    fx: { sound: true, ambient: true, immersive: true },
  },
  {
    key: "aurora",
    name: "Aurora",
    desc: "Serene northern-lights drift",
    swatch: ["#0a1120", "#22d3ee", "#34d399"],
    fx: { sound: true, ambient: true, immersive: true },
  },
  {
    key: "amber",
    name: "Amber CRT",
    desc: "Retro terminal nostalgia",
    swatch: ["#0a0700", "#ffb000", "#ffd060"],
    fx: { sound: true, ambient: true, immersive: true },
  },
  {
    key: "tokyonight",
    name: "Tokyo Night",
    desc: "Midnight city, lights still on",
    swatch: ["#1a1b26", "#7aa2f7", "#bb9af7"],
    fx: { sound: true, ambient: true, immersive: true },
  },
];

export const DEFAULT_THEME = "indigo";
const STORAGE_KEY = "portfolio-theme";

// Themes that ship a polished light variant. Immersive and pop-culture
// themes are dark-only by design, so light mode is gated to these keys.
export const MINIMAL_THEMES = ["indigo", "rosepine", "gruvbox", "evergreen", "solarized", "mono"];

export function isMinimalTheme(key: string): boolean {
  return MINIMAL_THEMES.includes(key);
}

// Resolve theme on first load: URL param, then localStorage, then default.
export function resolveInitialTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const urlParam = new URLSearchParams(window.location.search).get("theme");
  if (urlParam && THEMES.some((t) => t.key === urlParam)) return urlParam;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.key === stored)) return stored;
  return DEFAULT_THEME;
}

// Where the user last pressed, so the theme reveal grows from the picker click.
let lastPointer: { x: number; y: number } | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { lastPointer = { x: e.clientX, y: e.clientY }; }, { passive: true, capture: true });
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function commitTheme(key: string) {
  document.body.dataset.theme = key;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage unavailable (SSR or private mode)
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: key }));
}

/** Apply a theme. When `animate` is set and the browser supports View Transitions, the new palette grows out of the click point. */
export function applyTheme(key: string, animate = false) {
  if (!THEMES.some((t) => t.key === key)) return;
  const doc = document as ViewTransitionDoc;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!animate || reduced || !doc.startViewTransition || document.body.dataset.theme === key) {
    commitTheme(key);
    return;
  }
  const { x, y } = lastPointer || { x: window.innerWidth - 60, y: 30 };
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const t = doc.startViewTransition(() => commitTheme(key));
  t.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    })
    .catch(() => undefined);
}
