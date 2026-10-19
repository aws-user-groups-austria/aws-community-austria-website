/**
 * Writes src/data/meetups.generated.json, the data behind /meetups/ and
 * /meetups/<id>/, from every meetup.json in the meetup stream workspace:
 *
 *   <MEETUP_STREAM_DIR>/meetup-event-vienna/events/<id>/meetup.json  (contract: "meetup.json (version 1)" in SPEC.md)
 *
 * MEETUP_STREAM_DIR defaults to .. (this repo sits inside the workspace).
 * Works with whatever exists: a folder without meetup.json is skipped, a file
 * that breaks the contract is skipped with the reason. Only the contract's
 * fields are copied. Sorted newest first. The output is committed, so the
 * build needs no sibling folder.
 *
 * When the folder also has an event.json (contract "event.json (version 1)"),
 * the meetup gets an `evening`: the agenda segments (time, kind, title, talk
 * with abstract and speakers with bio and links), the notices, the code of
 * conduct (link and the "Growing Together" lines), the badges, and the
 * sponsors with logo and link.
 * Speaker photos are resolved to the copies npm run present:sync makes
 * (events/<id>/assets/<file> -> /present/events/<id>/assets/<file>,
 * people/<file> -> /present/people/<file>); a photo whose file is not there
 * is left out, never replaced by a placeholder.
 *
 * Also warns when a meetup says `stream: true` but public/present/events/<id>.json
 * is missing (run npm run present:sync, which runs this script after it).
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src", "data", "meetups.generated.json");
const PRESENT = join(ROOT, "public", "present");
const PRESENT_EVENTS = join(PRESENT, "events");
const KINDS = new Set(["networking", "welcome", "sponsor", "talk", "break", "closing"]);
const streamDir = resolve(ROOT, process.env.MEETUP_STREAM_DIR || "..");
const eventsRoot = join(streamDir, "meetup-event-vienna", "events");
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const isStr = (v) => typeof v === "string" && v.trim() !== "";
const isOptStr = (v) => v === undefined || typeof v === "string";
const isIso = (v) => isStr(v) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !Number.isNaN(Date.parse(v));
const isHttps = (v) => isStr(v) && /^https?:\/\//.test(v);

if (!isDir(eventsRoot)) {
  console.error(
    `meetups:sync failed: events folder not found at ${eventsRoot}\n` +
      `  Set MEETUP_STREAM_DIR to the folder that contains meetup-event-vienna/.`
  );
  process.exit(1);
}

/** The contract's fields only, or a list of what is wrong. */
function check(m, folder) {
  const errors = [];
  const need = (ok, what) => ok || errors.push(what);
  need(m?.version === 1, `"version" must be 1`);
  need(isStr(m?.id) && ID_PATTERN.test(m.id), `"id" must be lowercase letters, digits and hyphens`);
  need(isStr(m?.title), `"title" missing`);
  need(m?.number === undefined || Number.isInteger(m.number), `"number" must be an integer`);
  need(isHttps(m?.meetupUrl), `"meetupUrl" must be a link`);
  need(isIso(m?.start), `"start" must be an ISO date with time`);
  need(m?.end === undefined || isIso(m.end), `"end" must be an ISO date with time`);
  need(isStr(m?.group?.id) && isStr(m?.group?.name) && isHttps(m?.group?.url), `"group" needs id, name and url`);
  need(m?.venue === undefined || (isStr(m.venue.name) && isOptStr(m.venue.address)), `"venue" needs a name`);
  need(Array.isArray(m?.hosts) && m.hosts.every((h) => isStr(h?.name)), `"hosts" must be a list of { name }`);
  need(m?.image === undefined || isHttps(m.image), `"image" must be a link`);
  need(typeof m?.summary === "string", `"summary" missing`);
  need(typeof m?.description === "string", `"description" missing`);
  need(
    Array.isArray(m?.talks) &&
      m.talks.every((t) => isStr(t?.title) && Array.isArray(t.speakers) && t.speakers.every((s) => isStr(s?.name) && isOptStr(s.role) && isOptStr(s.company))),
    `"talks" must be a list of { title, speakers: [{ name, role?, company? }] }`
  );
  need(typeof m?.stream === "boolean", `"stream" must be true or false`);
  if (errors.length) return { errors };
  if (m.id !== folder) console.warn(`  note: ${folder}/meetup.json has id "${m.id}"; its page is /meetups/${m.id}/`);

  const media = {};
  for (const [key, ok] of [
    ["photos", (p) => isStr(p?.src)],
    ["slides", (s) => isStr(s?.title) && isHttps(s.url)],
    ["recordings", (r) => isStr(r?.title) && isHttps(r.url)],
  ]) {
    const list = m.media?.[key];
    if (Array.isArray(list) && list.length) {
      const good = list.filter(ok);
      if (good.length < list.length) console.warn(`  note: ${folder}: ${list.length - good.length} ${key} entr${list.length - good.length === 1 ? "y" : "ies"} without the required fields, left out`);
      if (good.length) media[key] = good;
    }
  }
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
  return {
    meetup: {
      version: 1,
      id: m.id,
      title: m.title.trim(),
      ...pick(m, ["number"]),
      meetupUrl: m.meetupUrl,
      start: m.start,
      ...pick(m, ["end"]),
      group: pick(m.group, ["id", "name", "url"]),
      ...(m.venue ? { venue: pick(m.venue, ["name", "address"]) } : {}),
      hosts: m.hosts.map((h) => ({ name: h.name.trim() })),
      ...pick(m, ["image"]),
      summary: m.summary,
      description: m.description,
      talks: m.talks.map((t) => ({ title: t.title, speakers: t.speakers.map((s) => pick(s, ["name", "role", "company"])) })),
      stream: m.stream,
      ...(Object.keys(media).length ? { media } : {}),
    },
  };
}

/** A photo path from event.json as the site serves it, or undefined when the file is not in public/present/. */
function photoUrl(photo, folder, notes) {
  if (!isStr(photo)) return undefined;
  if (/^https:\/\//.test(photo)) return photo;
  const rel = photo.replace(/^\/+/, "");
  if (/^(events\/[a-z0-9-]+\/assets|people|logos|badges)\/[^/]+$/.test(rel) && !rel.includes("..") && existsSync(join(PRESENT, rel))) return `/present/${rel}`;
  notes.push(`${folder}: photo ${photo} not found in public/present/, left out (run npm run present:sync)`);
  return undefined;
}

/** The evening from events/<id>/event.json, or undefined when there is none or it does not fit the contract. */
function evening(folder, notes) {
  const file = join(eventsRoot, folder, "event.json");
  if (!existsSync(file)) return undefined;
  let e;
  try {
    e = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    notes.push(`${folder}: event.json is not valid JSON (${err.message}), no agenda`);
    return undefined;
  }
  if (e?.version !== 1 || !isIso(e.doorsOpen) || !isIso(e.end) || !Array.isArray(e.segments)) {
    notes.push(`${folder}: event.json does not fit the contract (version, doorsOpen, end, segments), no agenda`);
    return undefined;
  }
  const speaker = (sp) => {
    const out = { name: sp.name.trim() };
    if (isStr(sp.role)) out.role = sp.role.trim();
    if (isStr(sp.company)) out.company = sp.company.trim();
    const photo = photoUrl(sp.photo, folder, notes);
    if (photo) out.photo = photo;
    if (isStr(sp.bio)) out.bio = sp.bio.trim();
    const links = (Array.isArray(sp.links) ? sp.links : []).filter((l) => isStr(l?.title) && /^https:\/\//.test(l?.url ?? ""));
    if (links.length) out.links = links.map((l) => ({ title: l.title.trim(), url: l.url }));
    return out;
  };
  const c = e.community;
  const badges = (Array.isArray(c?.badges) ? c.badges : [])
    .filter((b) => isStr(b?.name) && isStr(b?.title))
    .map((b) => {
      const image = photoUrl(b.image, folder, notes);
      return { name: b.name, title: b.title, ...(isStr(b.text) ? { text: b.text } : {}), ...(image ? { image } : {}) };
    });
  const coc = c?.codeOfConduct;
  const sponsors = (Array.isArray(e.sponsors) ? e.sponsors : [])
    .filter((sp) => isStr(sp?.name))
    .map((sp) => {
      const logo = photoUrl(sp.logo, folder, notes);
      return { name: sp.name.trim(), ...(isHttps(sp.url) ? { url: sp.url } : {}), ...(logo ? { logo } : {}) };
    });
  const agenda = e.segments
    .filter((g) => isStr(g?.id) && KINDS.has(g.kind) && isIso(g.start) && isIso(g.end) && isStr(g.title))
    .map((g) => {
      const seg = { id: g.id, kind: g.kind, start: g.start, end: g.end, title: g.title.trim() };
      if (g.kind === "talk" && isStr(g.talk?.title)) {
        seg.talk = {
          title: g.talk.title.trim(),
          ...(isStr(g.talk.abstract) ? { abstract: g.talk.abstract.trim() } : {}),
          speakers: (Array.isArray(g.talk.speakers) ? g.talk.speakers : []).filter((sp) => isStr(sp?.name)).map(speaker),
        };
      }
      return seg;
    });
  if (agenda.length < e.segments.length) notes.push(`${folder}: ${e.segments.length - agenda.length} agenda segment(s) without the required fields, left out`);
  return {
    doorsOpen: e.doorsOpen,
    end: e.end,
    agenda,
    notices: (Array.isArray(e.notices) ? e.notices : []).filter(isStr),
    ...(isHttps(e.links?.codeOfConduct) ? { codeOfConduct: e.links.codeOfConduct } : {}),
    ...(isStr(coc?.title) && Array.isArray(coc.lines)
      ? { conduct: { title: coc.title, ...(isStr(coc.subtitle) ? { subtitle: coc.subtitle } : {}), lines: coc.lines.filter(isStr) } }
      : {}),
    ...(badges.length ? { badges } : {}),
    ...(sponsors.length ? { sponsors } : {}),
  };
}

const meetups = [];
const skipped = [];
const notes = [];
for (const folder of readdirSync(eventsRoot).sort()) {
  const file = join(eventsRoot, folder, "meetup.json");
  if (!isDir(join(eventsRoot, folder)) || !existsSync(file)) continue;
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    skipped.push(`${folder}: not valid JSON (${err.message})`);
    continue;
  }
  const { meetup, errors } = check(data, folder);
  if (errors) {
    skipped.push(`${folder}: ${errors.join("; ")}`);
    continue;
  }
  if (meetups.some((x) => x.id === meetup.id)) {
    skipped.push(`${folder}: id "${meetup.id}" is used by another meetup.json`);
    continue;
  }
  const ev = evening(folder, notes);
  if (ev) meetup.evening = ev;
  // The slide deck PDF, when npm run present:sync copied one (public/decks/<id>.pdf).
  if (existsSync(join(ROOT, "public", "decks", `${meetup.id}.pdf`))) {
    meetup.deck = `/decks/${meetup.id}.pdf`;
    if (existsSync(join(ROOT, "public", "decks", `${meetup.id}.png`))) meetup.deckCover = `/decks/${meetup.id}.png`;
  }
  meetups.push(meetup);
}
meetups.sort((a, b) => Date.parse(b.start) - Date.parse(a.start) || a.id.localeCompare(b.id));

writeFileSync(OUT_FILE, JSON.stringify({ version: 1, meetups }, null, 2) + "\n");

const rel = (p) => relative(ROOT, p) || ".";
console.log(`meetups:sync: ${meetups.length} meetup${meetups.length === 1 ? "" : "s"} from ${eventsRoot}`);
for (const m of meetups) {
  const missing = m.stream && !existsSync(join(PRESENT_EVENTS, `${m.id}.json`));
  const talks = m.evening?.agenda.filter((g) => g.talk).length ?? 0;
  console.log(`  ${m.id}${m.stream ? " (room screen)" : ""}${m.evening ? ` agenda ${m.evening.agenda.length}, talks ${talks}` : ""}${missing ? `  warning: no ${rel(join(PRESENT_EVENTS, `${m.id}.json`))}, run npm run present:sync` : ""}`);
}
for (const s of skipped) console.warn(`  skipped ${s}`);
for (const n of notes) console.warn(`  note: ${n}`);
console.log(`Wrote ${rel(OUT_FILE)}`);
