/** Shared utilities for games */

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

export const isSmallScreen = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 640;
};
