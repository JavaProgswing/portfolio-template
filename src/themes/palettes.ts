/**
 * Theme palette definitions.
 * Applied at runtime via `document.body.dataset.theme = key`.
 * CSS variables for each theme are defined in src/index.css under `body[data-theme="X"]`.
 */

export interface ThemePalette {
  key: string;
  name: string;
  desc: string;
  /** 3 colors for the swatch preview in the switcher dropdown */
  swatch: [string, string, string];
}

export const THEMES: ThemePalette[] = [
  {
    key: "indigo",
    name: "Indigo",
    desc: "Default · zinc + indigo",
    swatch: ["#09090b", "#818cf8", "#a5b4fc"],
  },
  {
    key: "catppuccin",
    name: "Catppuccin",
    desc: "Mocha · warm dark + mauve",
    swatch: ["#1e1e2e", "#cba6f7", "#f5c2e7"],
  },
  {
    key: "tokyo",
    name: "Tokyo Night",
    desc: "Cool dark + neon blue",
    swatch: ["#1a1b26", "#7aa2f7", "#bb9af7"],
  },
  {
    key: "dracula",
    name: "Dracula",
    desc: "Classic dev purple",
    swatch: ["#282a36", "#bd93f9", "#ff79c6"],
  },
  {
    key: "nord",
    name: "Nord",
    desc: "Cool cyan · Scandinavian",
    swatch: ["#2e3440", "#88c0d0", "#81a1c1"],
  },
  {
    key: "rosepine",
    name: "Rose Pine",
    desc: "Soft rose aesthetic",
    swatch: ["#191724", "#ebbcba", "#c4a7e7"],
  },
  {
    key: "gruvbox",
    name: "Gruvbox",
    desc: "Warm yellow retro",
    swatch: ["#282828", "#fabd2f", "#fe8019"],
  },
  {
    key: "monokai",
    name: "Monokai",
    desc: "Bold pink + green",
    swatch: ["#2d2a2e", "#ff6188", "#a9dc76"],
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
