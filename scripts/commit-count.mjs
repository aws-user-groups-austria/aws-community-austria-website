/**
 * Counts the commits of this repository, automation and people apart.
 *
 *   npm run commits
 *   npm run commits -- --since 2026-01-01
 *
 * Most commits here come from the scheduled workflows (author
 * "github-actions[bot]"), so the plain total says little about how often
 * people touch the site. An author whose name ends in "[bot]" counts as
 * automation, every other author as a person. Merge commits count for
 * whoever made them. --since takes any date git understands.
 *
 * Needs the full history: in a shallow clone (the default checkout in CI)
 * it counts only the commits that were fetched.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const args = process.argv.slice(2);
let since = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--since" && args[i + 1]) since = args[++i];
  else if (args[i].startsWith("--since=") && args[i].length > 8) since = args[i].slice(8);
  else {
    console.error("Usage: node scripts/commit-count.mjs [--since <date>]");
    process.exit(2);
  }
}

// One line per commit, newest first: author name, tab, author date (YYYY-MM-DD).
let log;
try {
  log = execFileSync("git", ["log", "--format=%an%x09%as", ...(since ? [`--since=${since}`] : [])], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  console.error(`git log failed: ${(err.stderr || err.message).toString().trim()}`);
  process.exit(1);
}

const groups = { bots: new Map(), people: new Map() };
const latest = { bots: null, people: null };
let total = 0;
for (const line of log.split("\n")) {
  if (!line) continue;
  const [name, date] = line.split("\t");
  const kind = name.endsWith("[bot]") ? "bots" : "people";
  groups[kind].set(name, (groups[kind].get(name) ?? 0) + 1);
  latest[kind] ??= date; // the first one seen is the newest
  total++;
}

const sum = (m) => [...m.values()].reduce((a, b) => a + b, 0);
const share = (n) => (total ? ` (${Math.round((n / total) * 100)}%)` : "");
const list = (m) =>
  [...m]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, n]) => `  ${String(n).padStart(5)}  ${name}`)
    .join("\n");

const bots = sum(groups.bots);
const people = sum(groups.people);
console.log(`Commits${since ? ` since ${since}` : ""}: ${total}`);
console.log(`\nBy automation: ${bots}${share(bots)}`);
if (bots) console.log(list(groups.bots));
console.log(`\nBy people: ${people}${share(people)}`);
if (people) console.log(list(groups.people));
console.log(`\nMost recent commit by a person: ${latest.people ?? "none"}`);
console.log(`Most recent commit by automation: ${latest.bots ?? "none"}`);
