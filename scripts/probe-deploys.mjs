#!/usr/bin/env node
/**
 * Probe the live sites behind your GitHub repos so /lab knows which are
 * up and which can be embedded in an iframe.
 *
 * Usage: node scripts/probe-deploys.mjs [github-username]
 * Output: src/data/deploy-status.json  { "<url>": { status, up, embeddable, reason } }
 *
 * Reads homepages from the GitHub API plus `lab.deployed` overrides in me.ts.
 * Requires Node 18+.
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/data/deploy-status.json");

let me = "";
try { me = readFileSync(join(__dirname, "../src/data/me.ts"), "utf8"); } catch { /* optional */ }

const handle =
  process.argv[2] ||
  me.match(/github\.com\/([A-Za-z0-9-]+)/)?.[1] ||
  "";
if (!handle) { console.error("No GitHub username found. Pass one as an argument."); process.exit(1); }

const headers = { "User-Agent": "portfolio-probe", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const norm = (u) => {
  try { return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).toString().replace(/\/$/, ""); } catch { return ""; }
};

const DATA = join(__dirname, "../src/data");

// Public repo count (fallback for the homepage stat when the live API is rate-limited).
const userRes = await fetch(`https://api.github.com/users/${handle}`, { headers });
if (!userRes.ok) { console.error(`GitHub API ${userRes.status}`); process.exit(1); }
const user = await userRes.json();
writeFileSync(join(DATA, "github-stats.json"), JSON.stringify({ publicRepos: user.public_repos }, null, 2) + "\n");

const repos = [];
for (let page = 1; page <= Math.min(5, Math.ceil((user.public_repos || 1) / 100)); page++) {
  const res = await fetch(`https://api.github.com/users/${handle}/repos?per_page=100&page=${page}`, { headers });
  if (!res.ok) { console.error(`GitHub API ${res.status}`); process.exit(1); }
  repos.push(...(await res.json()));
}

// Optional: discover Vercel deployments that aren't linked from a GitHub homepage
// (CLI deploys, private repos). Needs VERCEL_TOKEN; VERCEL_TEAM_ID for team scopes.
if (process.env.VERCEL_TOKEN) {
  const q = new URLSearchParams({ limit: "100" });
  if (process.env.VERCEL_TEAM_ID) q.set("teamId", process.env.VERCEL_TEAM_ID);
  const vr = await fetch(`https://api.vercel.com/v9/projects?${q}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` } });
  if (vr.ok) {
    const { projects = [] } = await vr.json();
    const sites = projects
      .map((p) => {
        const aliases = (p.targets?.production?.alias || []).filter((a) => !a.includes("-git-") && !/-projects\.vercel\.app$/.test(a));
        const domain = aliases.sort((a, b) => a.length - b.length)[0];
        return domain ? { name: p.name, url: `https://${domain}`, repo: p.link?.repo || undefined } : null;
      })
      .filter(Boolean);
    writeFileSync(join(DATA, "vercel-sites.json"), JSON.stringify({ sites }, null, 2) + "\n");
    console.log(`vercel: ${sites.length} production domains`);
  } else {
    console.warn(`vercel: API ${vr.status}, keeping existing vercel-sites.json`);
  }
}

const urls = new Set();
const meta = {}; // url -> { repo, fork }
for (const r of repos) {
  const u = norm(r.homepage || "");
  if (u && !/github\.com\//i.test(u)) {
    urls.add(u);
    meta[u] = { repo: r.name, fork: !!r.fork };
  }
}
// lab.deployed overrides: "repo": "https://..."
const meNoComments = me.replace(/^\s*\/\/.*$/gm, "");
const block = meNoComments.match(/lab\s*:\s*\{[\s\S]*?deployed\s*:\s*\{([\s\S]*?)\}/);
if (block) for (const m of block[1].matchAll(/:\s*["']([^"']+)["']/g)) urls.add(norm(m[1]));

// Standalone sites (manual + Vercel-discovered)
for (const file of ["lab-sites.json", "vercel-sites.json"]) {
  try {
    const { sites = [] } = JSON.parse(readFileSync(join(DATA, file), "utf8"));
    for (const s of sites) {
      const u = norm(s.url || "");
      if (u && !meta[u]) { urls.add(u); meta[u] = { repo: s.repo || s.name, fork: false }; }
    }
  } catch { /* file optional */ }
}

async function probe(url) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "Mozilla/5.0 portfolio-probe" } });
    const xfo = (r.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (r.headers.get("content-security-policy") || "").toLowerCase();
    const ancestors = csp.match(/frame-ancestors([^;]*)/)?.[1]?.trim() || "";
    let embeddable = true;
    let reason = "";
    if (xfo.includes("deny") || xfo.includes("sameorigin")) { embeddable = false; reason = `X-Frame-Options: ${xfo}`; }
    else if (ancestors && !ancestors.includes("*")) { embeddable = false; reason = `CSP frame-ancestors ${ancestors}`; }
    const up = r.status < 400 || r.status === 401 || r.status === 403;
    if (!up) { embeddable = false; reason = `HTTP ${r.status}`; }
    return { status: r.status, up, embeddable, reason };
  } catch (e) {
    return { status: 0, up: false, embeddable: false, reason: String(e.cause?.code || e.name || "error") };
  }
}

const out = {};
await Promise.all([...urls].map(async (u) => { out[u] = { ...(meta[u] || { repo: "", fork: false }), ...(await probe(u)) }; }));
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");

for (const [u, v] of Object.entries(sorted)) {
  console.log(`${v.up ? (v.embeddable ? "ok     " : "no-embed") : "DOWN   "}  ${u}  ${v.reason}`);
}
console.log(`\nwrote ${Object.keys(sorted).length} entries to src/data/deploy-status.json`);
