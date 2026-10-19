/**
 * Copies the room-screen player (the meetup web player build) and the event
 * files into public/present/, served at /present/ ("Present" on a meetup page).
 *
 *   web player:  <MEETUP_STREAM_DIR>/meetup-stream-templates/web-player/dist/*     -> public/present/
 *                (except dist/events/, the player's own local copies)
 *   events:      <MEETUP_STREAM_DIR>/meetup-event-vienna/events/<id>/event.json    -> public/present/events/<id>.json
 *   assets:      <MEETUP_STREAM_DIR>/meetup-event-vienna/events/<id>/assets/       -> public/present/events/<id>/assets/
 *   people:      <MEETUP_STREAM_DIR>/meetup-event-vienna/people/                  -> public/present/people/
 *                (photos shared by every meetup, referenced as people/<file> in event.json)
 *   logos:       <MEETUP_STREAM_DIR>/meetup-event-vienna/logos/                   -> public/present/logos/
 *                (host and sponsor logos for the dark room screen, referenced as logos/<file>)
 *   index:       public/present/events/index.json, each event's Meetup link and id
 *   archive:     web-player/dist/events/archive.json (past meetups and their hosts, when the player build has it)
 *                -> public/present/events/archive.json
 *   decks:       <MEETUP_STREAM_DIR>/meetup-event-vienna/events/<id>/deck/<id>.pdf      -> public/decks/<id>.pdf
 *                and its first slide, deck/<id>-cover.png                              -> public/decks/<id>.png
 *                (the slide deck in our design, the PDF to present from; made by `make deck`.
 *                public/decks/ is replaced too: a deck removed in the workspace goes here as well)
 *
 * MEETUP_STREAM_DIR defaults to .. (this repo sits inside the meetup stream workspace).
 * Everything in public/present/ except README.md is replaced. Nothing is touched
 * until both sources have been found and checked.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "present");
const KEEP = new Set(["README.md"]);
/** Not copied from the player build: dist/events/ holds the player's own copies of the event files. */
const SKIP_FROM_DIST = new Set(["README.md", "events"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const streamDir = resolve(ROOT, process.env.MEETUP_STREAM_DIR || "..");
const playerDist = join(streamDir, "meetup-stream-templates", "web-player", "dist");
const eventsRoot = join(streamDir, "meetup-event-vienna", "events");
const peopleDir = join(streamDir, "meetup-event-vienna", "people");
const logosDir = join(streamDir, "meetup-event-vienna", "logos");
/** Image files only: people/README.md documents the sources and stays in the workspace. */
const IMAGE = /\.(png|jpe?g|webp|svg|avif)$/i;

function fail(message) {
  console.error(`present:sync failed: ${message}`);
  process.exit(1);
}

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

// 1. Check the sources.
if (!isDir(streamDir)) {
  fail(
    `meetup stream workspace not found at ${streamDir}\n` +
      `  Set MEETUP_STREAM_DIR to the folder that contains meetup-stream-templates/ and meetup-event-vienna/.`
  );
}
if (!existsSync(join(playerDist, "index.html"))) {
  fail(
    `web player build missing: ${join(playerDist, "index.html")} does not exist.\n` +
      `  Build it first: run "make player-build" in ${join(streamDir, "meetup-stream-templates")}`
  );
}
if (!isDir(eventsRoot)) {
  fail(`events folder not found at ${eventsRoot}`);
}

const events = [];
for (const name of readdirSync(eventsRoot).sort()) {
  if (!isDir(join(eventsRoot, name))) continue;
  const file = join(eventsRoot, name, "event.json");
  if (!existsSync(file)) {
    console.warn(`  skipped ${name}: no event.json (run "make sync EVENT=${name}" in meetup-event-vienna)`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    fail(`${file} is not valid JSON: ${err.message}`);
  }
  if (data?.version !== 1) fail(`${file}: expected "version": 1, found ${JSON.stringify(data?.version)}`);
  if (typeof data.id !== "string" || !ID_PATTERN.test(data.id)) {
    fail(`${file}: "id" must be lowercase letters, digits and hyphens, found ${JSON.stringify(data.id)}`);
  }
  if (data.id !== name) console.warn(`  note: ${name}/event.json has id "${data.id}"; publishing it as ${data.id}.json`);
  if (events.some((e) => e.id === data.id)) fail(`two event.json files share the id "${data.id}"`);
  const meetupUrl = data.links?.meetup ?? data.source?.meetupUrl;
  if (typeof meetupUrl !== "string") fail(`${file}: no links.meetup`);
  const assets = join(eventsRoot, name, "assets");
  events.push({ id: data.id, text, meetupUrl, title: data.title, doorsOpen: data.doorsOpen, assets: isDir(assets) ? assets : null });
}
if (events.length === 0) {
  fail(`no event.json found under ${eventsRoot}\n  Generate one first: run "make sync EVENT=<id>" in meetup-event-vienna`);
}

const people = isDir(peopleDir) ? readdirSync(peopleDir).filter((f) => IMAGE.test(f)).sort() : [];
if (people.length === 0) console.warn(`  note: no photos in ${peopleDir}; people/<file> references will not resolve`);

// 2. Replace public/present/ (keeping README.md).
mkdirSync(OUT_DIR, { recursive: true });
for (const name of readdirSync(OUT_DIR)) {
  if (!KEEP.has(name)) rmSync(join(OUT_DIR, name), { recursive: true, force: true });
}
for (const name of readdirSync(playerDist)) {
  if (SKIP_FROM_DIST.has(name)) continue;
  // Amazon Ember is used, never published: no font file of it leaves the workspace.
  cpSync(join(playerDist, name), join(OUT_DIR, name), { recursive: true, filter: (src) => !/amazon-?ember/i.test(src) });
}
const outEvents = join(OUT_DIR, "events");
mkdirSync(outEvents, { recursive: true });
for (const e of events) {
  writeFileSync(join(outEvents, `${e.id}.json`), e.text);
  if (e.assets) cpSync(e.assets, join(outEvents, e.id, "assets"), { recursive: true });
}
if (people.length > 0) {
  const outPeople = join(OUT_DIR, "people");
  mkdirSync(outPeople, { recursive: true });
  for (const f of people) cpSync(join(peopleDir, f), join(outPeople, f));
  writeFileSync(
    join(outPeople, "README.md"),
    "Generated by `npm run present:sync` (see ../README.md): photos shared by every meetup, copied from `meetup-event-vienna/people/` in the meetup stream workspace, where its README records each file's source. Do not edit by hand.\n"
  );
}
const logos = isDir(logosDir) ? readdirSync(logosDir).filter((f) => IMAGE.test(f)).sort() : [];
if (logos.length > 0) {
  const outLogos = join(OUT_DIR, "logos");
  mkdirSync(outLogos, { recursive: true });
  for (const f of logos) cpSync(join(logosDir, f), join(outLogos, f));
  writeFileSync(
    join(outLogos, "README.md"),
    "Generated by `npm run present:sync` (see ../README.md): host and sponsor logos for the dark room screen, copied from `meetup-event-vienna/logos/` in the meetup stream workspace, where its README records each file's source. Do not edit by hand.\n"
  );
}
const rel = (p) => relative(ROOT, p) || ".";
// badges/ and community/: the group's badges and photos for the intro screens.
for (const shared of ["badges", "community"]) {
  const dir = join(streamDir, "meetup-event-vienna", shared);
  const files = isDir(dir) ? readdirSync(dir).filter((f) => IMAGE.test(f)).sort() : [];
  if (files.length === 0) continue;
  const out = join(OUT_DIR, shared);
  mkdirSync(out, { recursive: true });
  for (const f of files) cpSync(join(dir, f), join(out, f));
  console.log(`  ${shared} ${files.length} files -> ${rel(out)}/`);
}
// decks/: each meetup's slide deck PDF, for its page and the organizers' page.
const DECKS = join(ROOT, "public", "decks");
rmSync(DECKS, { recursive: true, force: true });
const decks = readdirSync(eventsRoot)
  .filter((id) => ID_PATTERN.test(id) && existsSync(join(eventsRoot, id, "deck", `${id}.pdf`)))
  .sort();
if (decks.length) {
  mkdirSync(DECKS, { recursive: true });
  for (const id of decks) {
    cpSync(join(eventsRoot, id, "deck", `${id}.pdf`), join(DECKS, `${id}.pdf`));
    // The first slide as the deck's preview (written by make deck); PDFs do not show inside a page on every phone.
    const cover = join(eventsRoot, id, "deck", `${id}-cover.png`);
    if (existsSync(cover)) cpSync(cover, join(DECKS, `${id}.png`));
  }
  writeFileSync(join(DECKS, "README.md"), "Generated by `npm run present:sync`: each meetup's slide deck PDF, from `meetup-event-vienna/events/<id>/deck/<id>.pdf` (`make deck`). Do not edit by hand.\n");
}
console.log(`  decks ${decks.length} PDF${decks.length === 1 ? "" : "s"} -> ${rel(DECKS)}/${decks.length ? ` (${decks.join(", ")})` : ""}`);
const index = {
  version: 1,
  events: events.map(({ id, meetupUrl, title, doorsOpen }) => ({ id, meetupUrl, title, doorsOpen })),
};
writeFileSync(join(outEvents, "index.json"), JSON.stringify(index, null, 2) + "\n");
// The meetups and their hosts for the live header's "our meetups" and "our sponsors" screens (made by make player-event).
const archive = join(playerDist, "events", "archive.json");
if (existsSync(archive)) {
  cpSync(archive, join(outEvents, "archive.json"));
  console.log(`  archive ${rel(join(outEvents, "archive.json"))}`);
}
writeFileSync(
  join(outEvents, "README.md"),
  "Generated by `npm run present:sync` (see ../README.md): one `<id>.json` per meetup, `<id>/assets/` for its images, and `index.json` mapping each Meetup link to its id. Do not edit by hand.\n"
);

// 3. Report.
console.log(`present:sync: room-screen player from ${playerDist}`);
for (const e of events) {
  console.log(`  event ${e.id} -> ${rel(join(outEvents, `${e.id}.json`))}${e.assets ? ` (+ ${e.id}/assets/)` : ""}`);
}
if (logos.length > 0) console.log(`  logos ${logos.length} files -> ${rel(join(OUT_DIR, "logos"))}/`);
if (people.length > 0) console.log(`  people ${people.length} photo${people.length === 1 ? "" : "s"} -> ${rel(join(OUT_DIR, "people"))}/`);
console.log(`  index ${rel(join(outEvents, "index.json"))}: ${events.length} event${events.length === 1 ? "" : "s"}`);
console.log(`Wrote ${rel(OUT_DIR)}/ (open /present/?event=${events[events.length - 1].id})`);
