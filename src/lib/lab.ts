import { useEffect, useState } from "react";
import reposData from "../data/repos.json";
import deployStatus from "../data/deploy-status.json";
import labSites from "../data/lab-sites.json";
import vercelSites from "../data/vercel-sites.json";

export interface LabRepo {
  name: string;
  description: string;
  url: string;
  homepage: string;
  deployUrl: string; // "" when nothing live was found
  down: boolean; // probe says the site is unreachable / 404
  embeddable: boolean; // false when the site forbids iframes
  host: string; // vercel | netlify | ... | custom | ""
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  pushedAt: string;
  fork: boolean;
}

export interface LabProfile {
  login: string;
  name: string;
  avatar: string;
  bio: string;
  url: string;
  followers: number;
  following: number;
  publicRepos: number;
  location: string;
  blog: string;
}

export interface LabConfig {
  /** repo name (lowercase ok) -> live URL, for deploys GitHub's homepage field doesn't list */
  deployed?: Record<string, string>;
  defaultUser?: string;
}

export type OsKey = "windows" | "ubuntu" | "debian";

const HOSTS: [RegExp, string][] = [
  [/\.vercel\.app$|\.vercel\.dev$/, "vercel"],
  [/\.netlify\.app$/, "netlify"],
  [/\.pages\.dev$/, "cloudflare"],
  [/\.github\.io$/, "github pages"],
  [/\.onrender\.com$/, "render"],
  [/\.railway\.app$|\.up\.railway\.app$/, "railway"],
  [/\.fly\.dev$/, "fly.io"],
  [/\.herokuapp\.com$/, "heroku"],
  [/\.streamlit\.app$/, "streamlit"],
  [/\.hf\.space$|huggingface\.co$/, "hugging face"],
];

export const normalizeUrl = (raw: string): string => {
  const t = (raw || "").trim();
  if (!t) return "";
  try {
    return new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
};

export const hostOf = (url: string): string => {
  try {
    const h = new URL(url).hostname;
    for (const [re, name] of HOSTS) if (re.test(h)) return name;
    return "custom";
  } catch {
    return "";
  }
};

export const hostname = (url: string): string => {
  try { return new URL(url).hostname; } catch { return url; }
};

const isRepoLink = (u: string) => /(^|\/\/)(www\.)?github\.com\//i.test(u);

const buildRepo = (
  r: Partial<LabRepo> & { name: string },
  overrides: Record<string, string>
): LabRepo => {
  const homepage = normalizeUrl(r.homepage || "");
  const override = normalizeUrl(overrides[r.name.toLowerCase()] || "");
  const live = override || (homepage && !isRepoLink(homepage) ? homepage : "");
  const probe = live ? (deployStatus as Record<string, { up: boolean; embeddable: boolean }>)[live] : undefined;
  return {
    name: r.name,
    description: r.description || "",
    down: !!probe && !probe.up,
    embeddable: !probe || probe.embeddable,
    url: r.url || "",
    homepage,
    deployUrl: live,
    host: live ? hostOf(live) : "",
    language: r.language || "",
    stars: r.stars || 0,
    forks: r.forks || 0,
    topics: r.topics || [],
    pushedAt: r.pushedAt || "",
    fork: !!r.fork,
  };
};

const lowerKeys = (o: Record<string, string> = {}) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toLowerCase(), v]));

interface Cached { ts: number; profile: LabProfile; repos: LabRepo[] }
const TTL = 30 * 60 * 1000;
const cacheKey = (u: string) => `lab-gh:${u.toLowerCase()}`;

const readCache = (u: string): Cached | null => {
  try {
    const raw = localStorage.getItem(cacheKey(u));
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return Date.now() - c.ts < TTL ? c : null;
  } catch {
    return null;
  }
};

const writeCache = (u: string, c: Cached) => {
  try { localStorage.setItem(cacheKey(u), JSON.stringify(c)); } catch { /* quota/private */ }
};

/** Bundled snapshot (scripts/fetch-repos.mjs) used only for the site owner when the API is unavailable. */
const snapshotRepos = (overrides: Record<string, string>): LabRepo[] =>
  (reposData as { repos: any[] }).repos.map((r) => buildRepo(r, overrides));

interface ExtraSite { name: string; url: string; description?: string; repo?: string; language?: string }

/** Owner-only live sites GitHub doesn't know about: manual lab-sites.json + auto-discovered vercel-sites.json. */
const EXTRA_SITES: ExtraSite[] = [
  ...((labSites as { sites: ExtraSite[] }).sites || []),
  ...((vercelSites as { sites: ExtraSite[] }).sites || []),
];

/** Sites attached to an existing repo become overrides; the rest become standalone entries. */
export function withSites(repos: LabRepo[], overrides: Record<string, string>): LabRepo[] {
  const names = new Set(repos.map((r) => r.name.toLowerCase()));
  const live = new Set(repos.map((r) => r.deployUrl).filter(Boolean));
  const ov = { ...overrides };
  const extra: LabRepo[] = [];
  for (const site of EXTRA_SITES) {
    const url = normalizeUrl(site.url);
    if (!url || live.has(url)) continue;
    const target = (site.repo || site.name).toLowerCase();
    if (names.has(target)) { ov[target] = url; live.add(url); continue; }
    extra.push(buildRepo({ name: site.name, description: site.description || "", homepage: url, language: site.language || "" }, {}));
    live.add(url);
  }
  const merged = repos.map((r) => (ov[r.name.toLowerCase()] && !r.deployUrl ? buildRepo(r, ov) : r));
  return [...extra, ...merged];
}

export interface LabState {
  loading: boolean;
  error: string;
  profile: LabProfile | null;
  repos: LabRepo[];
  offline: boolean; // true when showing the bundled snapshot
}

export function useGithubLab(user: string, owner: string, config: LabConfig): LabState {
  const [state, setState] = useState<LabState>({ loading: true, error: "", profile: null, repos: [], offline: false });
  const overridesJson = JSON.stringify(config.deployed || {});

  useEffect(() => {
    const overrides = lowerKeys(JSON.parse(overridesJson));
    const isOwner = user.toLowerCase() === owner.toLowerCase();
    // Overrides are the owner's; never apply them to someone else's repos.
    const ov = isOwner ? overrides : {};
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));

    const cached = readCache(user);
    if (cached) {
      const built = cached.repos.map((r) => buildRepo(r, ov));
      setState({ loading: false, error: "", profile: cached.profile, repos: isOwner ? withSites(built, ov) : built, offline: false });
      return;
    }

    (async () => {
      try {
        const pr = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`);
        if (pr.status === 404) throw new Error(`no GitHub user named "${user}"`);
        if (!pr.ok) throw new Error("GitHub API rate limit hit");
        const p = await pr.json();
        // 100 per page; fetch every page the profile reports (capped at 5 to stay under the rate limit).
        const pages = Math.min(5, Math.max(1, Math.ceil((p.public_repos || 0) / 100)));
        const rs: any[] = [];
        for (let page = 1; page <= pages; page++) {
          const rr = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed&page=${page}`);
          if (!rr.ok) throw new Error("GitHub API rate limit hit");
          rs.push(...(await rr.json()));
        }
        const profile: LabProfile = {
          login: p.login, name: p.name || p.login, avatar: p.avatar_url, bio: p.bio || "",
          url: p.html_url, followers: p.followers, following: p.following,
          publicRepos: p.public_repos, location: p.location || "", blog: p.blog || "",
        };
        const repos = rs.map((r) =>
          buildRepo({
            name: r.name, description: r.description, url: r.html_url, homepage: r.homepage,
            language: r.language, stars: r.stargazers_count, forks: r.forks_count,
            topics: r.topics, pushedAt: r.pushed_at, fork: r.fork,
          }, ov)
        );
        if (cancelled) return;
        writeCache(user, { ts: Date.now(), profile, repos });
        setState({ loading: false, error: "", profile, repos: isOwner ? withSites(repos, ov) : repos, offline: false });
      } catch (e) {
        if (cancelled) return;
        if (isOwner) {
          setState({ loading: false, error: "", profile: null, repos: withSites(snapshotRepos(ov), ov), offline: true });
        } else {
          setState({ loading: false, error: (e as Error).message, profile: null, repos: [], offline: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user, owner, overridesJson]);

  return state;
}

export const hueOf = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

export const timeAgo = (iso: string): string => {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.round(d / 60))}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  if (d < 86400 * 60) return `${Math.round(d / 86400)}d ago`;
  if (d < 86400 * 730) return `${Math.round(d / (86400 * 30))}mo ago`;
  return `${Math.round(d / (86400 * 365))}y ago`;
};
