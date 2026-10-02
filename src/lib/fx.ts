// Global sound switch for theme FX. Visual effects keep running when muted.
const MUTE_KEY = "portfolio-fx-muted";

export function isFxMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function setFxMuted(muted: boolean) {
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent("fxmutechange", { detail: muted }));
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
