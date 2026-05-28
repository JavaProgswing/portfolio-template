#!/usr/bin/env node
/**
 * Fetch and score GitHub repos for the portfolio.
 *
 * Usage:
 *   node scripts/fetch-repos.mjs [github-username]
 *   GITHUB_TOKEN=ghp_... node scripts/fetch-repos.mjs
 *
 * Requires Node 18+ (built-in fetch).
 * Optional: set GITHUB_TOKEN env var to avoid rate limits (60 req/hr without token).
 *
 * Output: src/data/repos.json
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/data/repos.json");

// Read me.ts once — used for username + filter config.
let ME_SRC = "";
try {
  ME_SRC = readFileSync(join(__dirname, "../src/data/me.ts"), "utf8");
} catch {
  // ignore — username can come from CLI arg
}

/** Parse a simple string-array field from me.ts source, e.g. excludeRepos: ["a","b"] */
function parseStringArray(src, key) {
  const m = src.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`));
  if (!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1].toLowerCase());
}

// Repos to never show (exact names, case-insensitive)
const EXCLUDE = parseStringArray(ME_SRC, "excludeRepos");
// Forks to force-include despite being forks (e.g. GSoC contributions)
const INCLUDE = parseStringArray(ME_SRC, "includeRepos");

// ── Language complexity bonus ─────────────────────────────────────────────────
const LANG_SCORE = {
  rust: 4, zig: 4, assembly: 4, "c++": 3, c: 3, go: 3, haskell: 3, ocaml: 3,
  java: 2, "c#": 2, swift: 2, kotlin: 2,
  python: 1, typescript: 1, javascript: 0, ruby: 0,
  html: -1, css: -1, shell: 0, vue: 1, dart: 1,
};

// Names that signal tutorials/practice/throwaway projects
const GENERIC_NAME = /^(test[-_]?|hello[-_]?world|practice|playground|exercise|first[-_]?|demo[-_]?|example[-_]?|sample[-_]?|tutorial|learn[-_]|my[-_]first|untitled|new[-_]?repo|repo[-_]?\d|temp[-_]?|tmp[-_]?|wip[-_]?|sandbox|scratch)/i;

function scoreRepo(repo) {
  const nameLC = repo.name.toLowerCase();

  // Hard exclude — never show these
  if (EXCLUDE.includes(nameLC)) return -1;

  // Forced include — bypass fork filter for named repos (GSoC forks etc.)
  const forced = INCLUDE.includes(nameLC);

  if ((repo.fork || repo.archived || repo.private) && !forced) return -1;

  let s = 0;

  // Forced repos get a big boost so they surface near the top
  if (forced) s += 18;

  // ── Validation (peer interest is the strongest signal) ──────────────────────
  s += repo.stargazers_count * 8;
  // Cap forks credit at stars+2 — prevents template/fork-spam inflating score
  s += Math.min(repo.forks_count, repo.stargazers_count + 2) * 4;

  // ── Polish (deployed = the user actually shipped it) ────────────────────────
  if (repo.homepage) s += 10;
  // has_pages only counts when the repo has substance — prevents empty GH Pages stubs from inflating
  if (repo.has_pages && (repo.size || 0) > 100) s += 5;

  // ── Description quality (graduated, with penalty for no/weak desc) ──────────
  const desc = (repo.description || "").trim();
  if (desc.length >= 80)      s += 6;
  else if (desc.length >= 40) s += 3;
  else if (desc.length >= 15) s += 1;
  else                        s -= 4;  // PENALTY: no/weak description

  // ── Substance via repo size ─────────────────────────────────────────────────
  const sizeKB = repo.size || 0;
  if (sizeKB >= 5000)      s += 6;
  else if (sizeKB >= 1000) s += 4;
  else if (sizeKB >= 200)  s += 2;
  else if (sizeKB < 10)    s -= 8;     // PENALTY: empty/scaffold
  else if (sizeKB < 50)    s -= 5;     // PENALTY: tiny

  // ── Recency — favor newer projects, decay over 1 year ──────────────────────
  // Substantial older projects (stars >= 2) still rank high via star bonus,
  // but fresh ones get a real boost. Small + old = dropped.
  const ageDays = (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  const recency = Math.max(0, 1 - ageDays / 365);
  s += recency * 6;

  // Fresh + substantial bonus: pushed in last 30 days AND has description AND size
  if (ageDays < 30 && desc.length >= 30 && (repo.size || 0) >= 200) {
    s += 5;
  }

  // Forgotten penalty: not touched 2+ years AND fewer than 2 stars
  if (ageDays > 730 && repo.stargazers_count < 2) {
    s -= 6;
  }

  // ── Language complexity ────────────────────────────────────────────────────
  const lang = (repo.language || "").toLowerCase();
  s += (LANG_SCORE[lang] ?? 0) * 2;

  // ── Project maturity ────────────────────────────────────────────────────────
  if (repo.topics?.length > 0) s += 2;
  if (repo.topics?.length >= 3) s += 2;
  if (repo.license?.spdx_id) s += 2;
  if (repo.open_issues_count > 0 && repo.stargazers_count > 0) s += 2;

  // ── Combo: starred AND deployed = complete polished project ────────────────
  if (repo.stargazers_count > 0 && repo.homepage) s += 5;

  // ── Penalties ───────────────────────────────────────────────────────────────
  if (GENERIC_NAME.test(repo.name)) s -= 8;

  // Triple-weak penalty: weak description + no real deploy + tiny size = low effort
  // (has_pages without size doesn't count as "deployed" here)
  const weakDesc = desc.length < 40;
  const noRealDeploy = !repo.homepage;
  const small = sizeKB < 500;
  if (weakDesc && noRealDeploy && small) s -= 5;

  return s;
}

// ── Resolve username ──────────────────────────────────────────────────────────
let username = process.argv[2];

if (!username && ME_SRC) {
  // Find ALL github.com/<username> matches and pick the most frequent one.
  // Avoids picking upstream/dependency repos (e.g. BartoszCichecki in a fork link)
  // over the actual portfolio owner.
  const matches = [...ME_SRC.matchAll(/github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]*)/g)];
  const counts = {};
  for (const m of matches) {
    const u = m[1];
    if (u) counts[u] = (counts[u] || 0) + 1;
  }

  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (ranked.length > 0) {
    username = ranked[0][0];
    console.log(`Detected username: ${username} (${ranked[0][1]} mentions in me.ts)`);
    if (ranked.length > 1) {
      const others = ranked.slice(1, 4).map(([u, c]) => `${u}(${c})`).join(", ");
      console.log(`Other candidates skipped: ${others}`);
    }
  }
}

if (EXCLUDE.length) console.log(`Excluding repos: ${EXCLUDE.join(", ")}`);
if (INCLUDE.length) console.log(`Force-including (forks ok): ${INCLUDE.join(", ")}`);

if (!username) {
  console.error(
    "Provide a GitHub username:\n  node scripts/fetch-repos.mjs <username>"
  );
  process.exit(1);
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
const headers = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "portfolio-fetch-repos/1.0",
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
}

console.log(`\nFetching repos for @${username} …`);

let allRepos = [];
let page = 1;

while (true) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
    { headers }
  );

  if (!res.ok) {
    const msg = await res.text();
    console.error(`GitHub API error ${res.status}: ${msg}`);
    if (res.status === 403) {
      console.error("Rate limited. Set GITHUB_TOKEN env var to increase limit.");
    }
    process.exit(1);
  }

  const batch = await res.json();
  if (batch.length === 0) break;
  allRepos.push(...batch);
  if (batch.length < 100) break;
  page++;
}

console.log(`Found ${allRepos.length} public repos. Scoring…`);

const scored = allRepos
  .map((r) => ({ repo: r, score: scoreRepo(r) }))
  .filter(({ score }) => score >= 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 12)
  .map(({ repo: r, score }) => ({
    name: r.name,
    description: r.description || "",
    url: r.html_url,
    homepage: r.homepage || "",
    language: r.language || "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics || [],
    pushedAt: r.pushed_at,
    score: Math.round(score * 10) / 10,
  }));

writeFileSync(
  OUT,
  JSON.stringify({ repos: scored, fetchedAt: new Date().toISOString(), username }, null, 2)
);

console.log(`\n✓ Wrote ${scored.length} repos to src/data/repos.json\n`);
console.log("  Score  Repo");
console.log("  ─────  ────");
scored.slice(0, 8).forEach((r) =>
  console.log(`  ${String(r.score).padEnd(5)}  ${r.name}`)
);
