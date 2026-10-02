/**
 * Copy your resume PDF into public/resume.pdf (served at /resume).
 *
 * Source: RESUME_SOURCE_PATH env var, else `resume.source` in portfolio.config.json.
 * If a current_resume.txt sits next to the source, it may point at another PDF in
 * the same folder. If src/data/resume-content.ts records `sha256: "<hash>"`, the
 * PDF must match it, so the site text is re-reviewed whenever the PDF changes.
 *
 * Usage: npm run resume:sync   |   npm run resume:check (verify only)
 */
import { createHash } from "node:crypto";
import { access, copyFile, readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { expandHome, loadConfig, repoRoot } from "./config.mjs";

const configured = expandHome(process.env.RESUME_SOURCE_PATH || loadConfig().resume?.source || "");
if (!configured) {
  console.log("resume: no source configured (resume.source in portfolio.config.json); skipping.");
  process.exit(0);
}
const pdfDir = dirname(configured);
const pointerPath = join(pdfDir, "current_resume.txt");
const pointer = existsSync(pointerPath) ? readFileSync(pointerPath, "utf8").trim() : "";
const source = pointer ? resolve(pdfDir, pointer) : configured;
if (pointer && !source.startsWith(pdfDir + sep)) {
  throw new Error("current_resume.txt must point inside the resume folder.");
}
const target = join(repoRoot, "public", "resume.pdf");
const resumeContentPath = join(repoRoot, "src", "data", "resume-content.ts");
const checkOnly = process.argv.includes("--check");

async function hash(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

await access(source);
const sourceStats = await stat(source);
if (!sourceStats.isFile() || sourceStats.size === 0) {
  throw new Error(`Resume source is not a readable PDF: ${source}`);
}

const sourceHash = await hash(source);
// Optional review gate (see header).
const recordedHashMatch = existsSync(resumeContentPath)
  ? (await readFile(resumeContentPath, "utf8")).match(/sha256:\s*"([a-f0-9]{64})"/i)
  : null;
if (recordedHashMatch && recordedHashMatch[1].toLowerCase() !== sourceHash) {
  throw new Error(
    "The resume PDF changed. Review resume-content.ts, then update its sha256 before deploying.",
  );
}

let matches = false;
try {
  matches = sourceHash === (await hash(target));
} catch {
  matches = false;
}

if (checkOnly) {
  if (!matches) {
    throw new Error(
      "public/resume.pdf is stale. Run `npm run resume:sync` before deploying.",
    );
  }
  console.log(`Resume is current: ${target}`);
  process.exit(0);
}

if (!matches) {
  await copyFile(source, target);
  console.log(`Updated ${target}`);
} else {
  console.log(`Resume already current: ${target}`);
}

console.log(`Authoritative source: ${source}`);
console.log(`Source modified: ${sourceStats.mtime.toISOString()}`);
