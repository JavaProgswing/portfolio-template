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
const CURATION = JSON.parse(readFileSync(join(__dirname, "../src/data/repo-curation.json"), "utf8"));
const PRIMARY = CURATION.primaryRepos.map((name) => name.toLowerCase());
const useAI = !process.argv.includes("--no-ai");

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
const THIN_WRAPPER_NAME = /(^site[-_])|(-vercel$)|(^vercel[-_])|(^github[-_]?io$)/i;

function normalizeUrl(url) {
  try {
    return new URL(url).toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function scoreRepo(repo) {
  const nameLC = repo.name.toLowerCase();

  // Hard exclude — never show these
  if (EXCLUDE.includes(nameLC)) return -1;

  // Forced include — bypass fork filter for named repos (GSoC forks etc.)
  const forced = INCLUDE.includes(nameLC);

  if ((repo.fork || repo.archived || repo.private) && !forced) return -1;

  let s = 0;
  const repoUrl = normalizeUrl(repo.html_url || "");
  const homepageUrl = normalizeUrl(repo.homepage || "");
  const hasRealHomepage = !!homepageUrl && homepageUrl !== repoUrl;

  // Forced repos get a big boost so they surface near the top
  if (forced) s += 10;

  // ── Validation (peer interest is the strongest signal) ──────────────────────
  s += repo.stargazers_count * 8;
  // Cap forks credit at stars+2 — prevents template/fork-spam inflating score
  s += Math.min(repo.forks_count, repo.stargazers_count + 2) * 4;

  // ── Polish (deployed = the user actually shipped it) ────────────────────────
  if (hasRealHomepage) s += 10;
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

  // ── Recency — active, substantial work should rise quickly ─────────────────
  // Activity decays over 18 months, while quality gates keep empty new repos
  // from outranking projects that are actually useful or shipped.
  const ageDays = (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  const recency = Math.max(0, 1 - ageDays / 540);
  s += recency * 14;

  // Fresh + substantial bonus: recent work with enough code and context.
  if (ageDays < 45 && desc.length >= 30 && sizeKB >= 200) {
    s += 9;
  } else if (ageDays < 120 && desc.length >= 30 && sizeKB >= 200) {
    s += 4;
  }

  // Stale, unvalidated projects should make room for current work.
  if (ageDays > 540 && repo.stargazers_count < 2) {
    s -= 8;
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
  if (repo.stargazers_count > 0 && hasRealHomepage) s += 5;

  // ── Penalties ───────────────────────────────────────────────────────────────
  if (GENERIC_NAME.test(repo.name)) s -= 8;
  if (THIN_WRAPPER_NAME.test(repo.name)) s -= 8;

  // Force-included forks should stay visible, but they should not dominate the grid
  // over original work when they have no stars/forks on the fork itself.
  if (forced && repo.fork && repo.stargazers_count === 0 && repo.forks_count === 0) s -= 10;

  // Triple-weak penalty: weak description + no real deploy + tiny size = low effort
  // (has_pages without size doesn't count as "deployed" here)
  const weakDesc = desc.length < 40;
  const noRealDeploy = !hasRealHomepage;
  const small = sizeKB < 500;
  if (weakDesc && noRealDeploy && small) s -= 5;

  return s;
}

// ── Resolve username ──────────────────────────────────────────────────────────
let username = process.argv.slice(2).find((arg) => !arg.startsWith("--"));

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

const candidates = allRepos
  .map((repo) => ({ repo, score: scoreRepo(repo) }))
  .filter(({ repo, score }) => score >= 0 || PRIMARY.includes(repo.name.toLowerCase()))
  .filter(({ repo }) => repo.html_url === `https://github.com/${username}/${repo.name}`)
  .sort((a, b) => b.score - a.score);

// AI supplies a bounded editorial signal. GitHub metadata and pinned primary
// projects remain authoritative; malformed model output cannot change files.
let aiScores = new Map();
if (useAI && candidates.length) {
  const shortlist = candidates.slice(0, 35).map(({ repo, score }) => ({
    name: repo.name,
    description: (repo.description || "").slice(0, 300),
    language: repo.language,
    topics: repo.topics,
    stars: repo.stargazers_count,
    sizeKB: repo.size,
    baseScore: Math.round(score),
  }));
  const prompt = `Rank these public software repositories for a student ML/software-engineering portfolio. Award an integer editorial score from -15 to 15 for original engineering, demonstrable functionality, evaluation, and useful documentation. Penalize thin wrappers, tutorials, vague claims, and duplicates. Do not invent evidence. Return only JSON: {"scores":[{"name":"exact repo name","score":integer}]} with one entry per input.\n${JSON.stringify(shortlist)}`;
  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: CURATION.model, prompt, stream: false, format: "json", options: { temperature: 0, num_ctx: 8192 } }),
      signal: AbortSignal.timeout(180_000),
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const payload = await response.json();
    const parsed = JSON.parse(payload.response);
    if (!Array.isArray(parsed.scores)) throw new Error("missing scores array");
    const allowed = new Set(shortlist.map((repo) => repo.name.toLowerCase()));
    for (const item of parsed.scores) {
      if (typeof item.name !== "string" || !allowed.has(item.name.toLowerCase()) ||
          !Number.isInteger(item.score) || item.score < -15 || item.score > 15) {
        throw new Error("invalid model score");
      }
      aiScores.set(item.name.toLowerCase(), item.score);
    }
    if (aiScores.size !== shortlist.length) throw new Error("incomplete model scores");
    console.log(`Ollama ${CURATION.model} evaluated ${aiScores.size} repos.`);
  } catch (error) {
    aiScores = new Map();
    console.warn(`Ollama ranking unavailable (${error.message}); using verified GitHub scoring.`);
  }
}

const scored = candidates
  .map(({ repo, score }) => ({ repo, score: score + (aiScores.get(repo.name.toLowerCase()) || 0), primary: PRIMARY.includes(repo.name.toLowerCase()) }))
  .sort((a, b) => Number(b.primary) - Number(a.primary) || b.score - a.score || a.repo.name.localeCompare(b.repo.name))
  .slice(0, CURATION.maxRepos)
  .map(({ repo: r, score, primary }) => ({
    name: r.name,
    description: r.description || CURATION.descriptions[r.name] || "",
    url: r.html_url,
    homepage: r.homepage || "",
    language: r.language || "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics || [],
    pushedAt: r.pushed_at,
    score: Math.round(score * 10) / 10,
    primary,
  }));

const missingPrimary = CURATION.primaryRepos.filter((name) => !scored.some((repo) => repo.name.toLowerCase() === name.toLowerCase()));
if (missingPrimary.length) console.warn(`Primary repos not public/available: ${missingPrimary.join(", ")}`);

writeFileSync(
  OUT,
  JSON.stringify({ repos: scored, fetchedAt: new Date().toISOString(), username, rankingModel: aiScores.size ? CURATION.model : "github-fallback" }, null, 2)
);

console.log(`\n✓ Wrote ${scored.length} repos to src/data/repos.json\n`);
console.log("  Score  Repo");
console.log("  ─────  ────");
scored.slice(0, 8).forEach((r) =>
  console.log(`  ${String(r.score).padEnd(5)}  ${r.name}`)
);
