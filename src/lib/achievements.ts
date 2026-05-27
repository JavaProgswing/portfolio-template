/**
 * Achievement tracker — persists discovered easter eggs in localStorage.
 *
 * Each achievement has a key, a friendly label, and a short hint. Discovery
 * is global (not per-session) so users can come back and see what they've found.
 *
 * Achievements are intentionally hidden by default. Use the /console
 * `achievements` command to see what you've unlocked.
 */

const STORAGE_KEY = "portfolio-achievements";

export interface Achievement {
  key: string;
  label: string;
  hint: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: "konami",       label: "The Old Code",      hint: "↑↑↓↓←→←→ba — gamer DNA confirmed" },
  { key: "matrix",       label: "Wake Up, Neo",      hint: "Typed the word that flips reality" },
  { key: "rainbow",      label: "Spectrum",          hint: "Brought color to the world for 6 seconds" },
  { key: "coffee",       label: "Caffeinated",       hint: "Spoke the magic word" },
  { key: "pizza",        label: "Slice of Life",     hint: "Knows what really matters" },
  { key: "vim",          label: "Modal Thinker",     hint: "Speaks the editor's name" },
  { key: "bug",          label: "Bug Hunter",        hint: "Summoned a critter" },
  { key: "logo-burst",   label: "Insistent Clicker", hint: "5x logo · received well-earned confetti" },
  { key: "command-pal",  label: "Power User",        hint: "Found ⌘K" },
  { key: "shortcuts",    label: "Reader",            hint: "Pressed ? for shortcuts" },
  { key: "console",      label: "Old School",        hint: "Visited the terminal at /console" },
  { key: "got-404",      label: "Wanderer",          hint: "Stumbled into the 404 page" },
  { key: "night-owl",    label: "Night Owl",         hint: "Browsed between 3 and 6 AM" },
  { key: "guestbook",    label: "Left a Mark",       hint: "Signed the guestbook" },
  { key: "all-themes",   label: "Decorator",         hint: "Tried every theme" },
  { key: "vim-nav",      label: "h/j/k/l",           hint: "Used vim-style navigation" },
  { key: "triple-esc",   label: "Just Stop",         hint: "Closed everything with triple Esc" },
  { key: "snake-played", label: "Player One",        hint: "Found the hidden snake game" },
  { key: "snake-50",     label: "Snake Charmer",     hint: "Scored 50+ in snake" },
  { key: "snake-100",    label: "Asp Master",        hint: "Scored 100+ in snake" },
  { key: "suggester",    label: "Helpful Hand",      hint: "Sent a site suggestion" },
];

function load(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function save(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage unavailable
  }
}

/** Unlock an achievement. Returns true if it's a new unlock. */
export function unlock(key: string): boolean {
  if (typeof window === "undefined") return false;
  const found = load();
  if (found.has(key)) return false;
  found.add(key);
  save(found);
  window.dispatchEvent(new CustomEvent("achievement-unlock", { detail: { key } }));
  return true;
}

export function isUnlocked(key: string): boolean {
  return load().has(key);
}

export function getUnlocked(): Set<string> {
  return load();
}

export function getStats() {
  const unlocked = load();
  return {
    found: unlocked.size,
    total: ACHIEVEMENTS.length,
    unlocked,
  };
}

export function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
