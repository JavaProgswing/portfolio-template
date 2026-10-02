const explicitApiBase = (import.meta.env.VITE_API_BASE || "").trim();

const isVercelHost = (() => {
  if (typeof window === "undefined") return false;
  return /(^|\.)vercel\.(app|dev)$/.test(window.location.hostname);
})();

export const API_BASE =
  explicitApiBase ||
  (isVercelHost ? "/_/backend" : "/api/portfolio");
