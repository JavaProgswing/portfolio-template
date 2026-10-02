// Reads portfolio.config.json (gitignored, machine-specific). Missing file = {}.
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadConfig() {
  const path = join(repoRoot, "portfolio.config.json");
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Expand a leading ~ to the home directory. */
export const expandHome = (p) => (p && p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
