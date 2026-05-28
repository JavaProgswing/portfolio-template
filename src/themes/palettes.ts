/**
 * Theme palette definitions.
 * Applied at runtime via `document.body.dataset.theme = key`.
 * CSS variables for each theme are defined in src/index.css under `body[data-theme="X"]`.
 *
 * Ordering: default → normal dev themes → pop-culture/custom themes.
 */

export interface ThemePalette {
  key: string;
  name: string;
  desc: string;
  /** 3 colors for the swatch preview in the switcher dropdown */
  swatch: [string, string, string];
}

export const THEMES: ThemePalette[] = [
  // ── Normal themes ──
  {
    key: "indigo",
    name: "Indigo",
    desc: "Default · zinc + indigo",
    swatch: ["#09090b", "#818cf8", "#a5b4fc"],
  },
  {
    key: "dracula",
    name: "Dracula",
    desc: "Classic dev purple",
    swatch: ["#282a36", "#bd93f9", "#ff79c6"],
  },
  {
    key: "monokai",
    name: "Monokai",
    desc: "Bold pink + green",
    swatch: ["#2d2a2e", "#ff6188", "#a9dc76"],
  },
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    desc: "Electric yellow + cyan",
    swatch: ["#0a0a0f", "#fcee0a", "#00f0ff"],
  },
  {
    key: "aurora",
    name: "Aurora",
    desc: "Cyan + emerald · navy",
    swatch: ["#0a1120", "#22d3ee", "#34d399"],
  },
  {
    key: "amber",
    name: "Amber CRT",
    desc: "Old terminal glow",
    swatch: ["#0a0700", "#ffb000", "#ffd060"],
  },
  // ── Pop-culture / custom themes ──
  {
    key: "valorant",
    name: "Valorant",
    desc: "Tactical red · gunmetal",
    swatch: ["#0f1923", "#ff4655", "#ece8e1"],
  },
  {
    key: "arcane",
    name: "Arcane",
    desc: "Hextech blue + gold",
    swatch: ["#0a0e1a", "#1e90ff", "#c8aa6e"],
  },
  {
    key: "pragmata",
    name: "Pragmata",
    desc: "Lunar void · cold cyan",
    swatch: ["#050508", "#e8e8f0", "#00d4ff"],
  },
  {
    key: "stranger",
    name: "Stranger Things",
    desc: "Flickering red · Hawkins",
    swatch: ["#0a0000", "#e74033", "#f5d76e"],
  },
];

export const DEFAULT_THEME = "indigo";
const STORAGE_KEY = "portfolio-theme";

/** Resolve theme on first load: URL param > localStorage > default */
export function resolveInitialTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const urlParam = new URLSearchParams(window.location.search).get("theme");
  if (urlParam && THEMES.some((t) => t.key === urlParam)) return urlParam;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && THEMES.some((t) => t.key === stored)) return stored;
  return DEFAULT_THEME;
}

export function applyTheme(key: string) {
  if (!THEMES.some((t) => t.key === key)) return;
  document.body.dataset.theme = key;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // localStorage not available (SSR / private mode)
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: key }));
}
