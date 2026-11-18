/**
 * Fetches the upcoming events of all AWS UG Austria groups from Meetup and
 * saves them to public/data/meetups.json. Runs via GitHub Actions every day.
 *
 * The RSS feed gives the event links only: its pubDate is when an event was
 * announced, not when it takes place. So each event page is read for its
 * JSON-LD Event (startDate, name, location), and only events that have not
 * started yet are kept.
 *
 * The group's events page is a second source: its __NEXT_DATA__ lists the
 * upcoming events too. Meetup sometimes answers GitHub's runners with a page
 * that has no feed items or no JSON-LD; with two sources one of them still
 * works, and every page that cannot be read is reported as a GitHub warning
 * instead of being skipped silently. A group that cannot be read at all keeps
 * the events the file had for it, and the run fails when no group can be read.
 *
 * Also each group's last meetup, from its "past events" page (the page's
 * __NEXT_DATA__), so a group page can show the last one when no new one is
 * planned yet.
 *
 * The file is written only when the events change, so a day without news
 * leaves no commit behind.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(__dirname, "../public/data/meetups.json");
const UA = "Mozilla/5.0 (compatible; aws-community-austria-website/1.0; +https://awscommunity.at)";

const GROUPS = [
  { name: "AWS UG Vienna",   urlname: "amazon-web-services-aws-vienna" },
  { name: "AWS WUG Vienna",  urlname: "aws-womens-user-group-vienna" },
  { name: "AWS UG Linz",     urlname: "aws-user-group-linz" },
];

/** A warning in the log, shown as an annotation on the GitHub Actions run. */
function warn(message) {
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `warning: ${message}`);
}

/** What a page that is not what we asked for looks like, for the log: its <title> and size. */
function describe(text) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(text)?.[1]?.trim().slice(0, 80);
  return `${text.length} bytes${title ? `, title "${title}"` : ""}`;
}

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Event links from a group's RSS feed; null when the text is not a feed at all. */
function rssLinks(xml) {
  if (!/<rss\b|<channel\b/i.test(xml)) return null;
  const links = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const link = m[1].match(/<link>\s*(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?\s*<\/link>/)?.[1];
    if (link) links.push(link.endsWith("/") ? link : `${link}/`);
  }
  return links;
}

/** The JSON-LD Event of an event page. */
function jsonLdEvent(html) {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(m[1]); } catch { continue; }
    const nodes = (Array.isArray(data) ? data : [data]).flatMap((n) => [n, ...(n?.["@graph"] ?? [])]);
    const ev = nodes.find((n) => [].concat(n?.["@type"] ?? []).includes("Event"));
    if (ev) return ev;
  }
  return undefined;
}

/** "Name, street", without the repeats Meetup's JSON-LD has (the name is often the street, the city comes twice). */
function venueOf(ev) {
  const loc = ev.location ?? {};
  const name = typeof loc.name === "string" ? loc.name.trim() : "";
  const a = loc.address;
  let street = (typeof a === "string" ? a : a?.streetAddress ?? "").trim();
  const city = typeof a === "object" ? (a?.addressLocality ?? "").trim() : "";
  if (city && street.endsWith(`, ${city}`) && street.slice(0, -city.length - 2).includes(city)) street = street.slice(0, -city.length - 2);
  if (!street) return name;
  return name && !street.startsWith(name) ? `${name}, ${street}` : street;
}

/** The Apollo state in a Meetup page's __NEXT_DATA__; undefined when the page has none. */
function apolloState(html) {
  const m = /<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return undefined;
  try {
    return JSON.parse(m[1]).props?.pageProps?.__APOLLO_STATE__ ?? undefined;
  } catch {
    return undefined;
  }
}

/** "Name, street" of an Apollo Venue, without the name twice. */
function apolloVenue(apollo, ref) {
  const v = ref?.__ref ? apollo[ref.__ref] : undefined;
  if (!v) return "";
  const name = String(v.name ?? "").trim();
  const street = String(v.address ?? "").trim();
  if (!street) return name;
  return name && !street.startsWith(name) ? `${name}, ${street}` : street;
}

/** Upcoming events from a group's events page; null when the page cannot be read. */
async function pageEvents(group) {
  let html;
  try {
    html = await get(`https://www.meetup.com/${group.urlname}/events/`);
  } catch (err) {
    warn(`${group.name}: events page not read (${err.message})`);
    return null;
  }
  const apollo = apolloState(html);
  if (!apollo) {
    warn(`${group.name}: events page has no event data (${describe(html)})`);
    return null;
  }
  const now = Date.now();
  return Object.entries(apollo)
    .filter(([key, v]) => key.startsWith("Event:") && typeof v.eventUrl === "string" && typeof v.dateTime === "string" && Date.parse(v.dateTime) > now && v.status !== "CANCELLED")
    .map(([, v]) => ({
      title: String(v.title ?? "").trim(),
      link: v.eventUrl.endsWith("/") ? v.eventUrl : `${v.eventUrl}/`,
      date: new Date(v.dateTime).toISOString(),
      venue: apolloVenue(apollo, v.venue),
      group: group.name,
      groupUrl: `https://www.meetup.com/${group.urlname}/`,
    }));
}

/** The latest past event of a group, from its past-events page; undefined when the page cannot be read. */
async function lastEvent(group) {
  let html;
  try {
    html = await get(`https://www.meetup.com/${group.urlname}/events/?type=past`);
  } catch (err) {
    console.error(`Failed to read the past events of ${group.name}: ${err.message}`);
    return undefined;
  }
  const apollo = apolloState(html);
  if (!apollo) {
    warn(`${group.name}: past events page has no event data (${describe(html)})`);
    return undefined;
  }
  const now = Date.now();
  const past = Object.entries(apollo)
    .filter(([key, v]) => key.startsWith("Event:") && typeof v.eventUrl === "string" && typeof v.dateTime === "string" && Date.parse(v.dateTime) < now)
    .map(([, v]) => ({ title: String(v.title ?? "").trim(), link: v.eventUrl.endsWith("/") ? v.eventUrl : `${v.eventUrl}/`, date: new Date(v.dateTime).toISOString() }))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return past[0] ? { ...past[0], group: group.name, groupUrl: `https://www.meetup.com/${group.urlname}/` } : undefined;
}

/** Upcoming events from a group's RSS feed and the event pages it links; null when the feed cannot be read. */
async function feedEvents(group) {
  let xml;
  try {
    xml = await get(`https://www.meetup.com/${group.urlname}/events/rss/`);
  } catch (err) {
    warn(`${group.name}: feed not read (${err.message})`);
    return null;
  }
  const links = rssLinks(xml);
  if (!links) {
    warn(`${group.name}: the feed is not a feed (${describe(xml)})`);
    return null;
  }
  const events = [];
  for (const link of links) {
    let html;
    try {
      html = await get(link);
    } catch (err) {
      warn(`${group.name}: ${link} not read (${err.message})`);
      continue;
    }
    const ev = jsonLdEvent(html);
    if (!ev?.startDate || !ev?.name) {
      warn(`${group.name}: ${link} has no event data (${describe(html)})`);
      continue;
    }
    const date = new Date(ev.startDate).toISOString();
    if (new Date(date) < new Date()) continue;
    events.push({ title: String(ev.name).trim(), link, date, venue: venueOf(ev), group: group.name, groupUrl: `https://www.meetup.com/${group.urlname}/` });
  }
  return events;
}

/** A group's upcoming events from both sources, the feed's first; null when neither could be read. */
async function fetchGroup(group) {
  const feed = await feedEvents(group);
  const page = await pageEvents(group);
  console.log(`${group.name}: feed ${feed ? `${feed.length} upcoming` : "unreadable"}, events page ${page ? `${page.length} upcoming` : "unreadable"}`);
  if (!feed && !page) return null;
  const events = [...(feed ?? [])];
  for (const e of page ?? []) if (!events.some((x) => x.link === e.link)) events.push(e);
  return events;
}

const previous = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : { events: [] };
const all = [];
let unreadable = 0;
for (const group of GROUPS) {
  const events = await fetchGroup(group);
  if (events) {
    all.push(...events);
  } else {
    // Neither source could be read today: keep what the file had for this group.
    unreadable++;
    warn(`${group.name}: nothing could be read, keeping its events from the file`);
    all.push(...(previous.events ?? []).filter((e) => e.group === group.name && Date.parse(e.date) > Date.now()));
  }
}
all.sort((a, b) => new Date(a.date) - new Date(b.date));
const events = all.slice(0, 6);

const last = [];
for (const group of GROUPS) {
  const e = await lastEvent(group);
  // When a page cannot be read today, keep what the file had for that group.
  const kept = e ?? (previous.last ?? []).find((x) => x.group === group.name);
  if (kept) last.push(kept);
}
if (JSON.stringify(previous.events ?? []) === JSON.stringify(events) && JSON.stringify(previous.last ?? []) === JSON.stringify(last)) {
  console.log(`No change: ${events.length} upcoming events, ${last.length} last ones, ${OUT_FILE} left as it is`);
} else {
  writeFileSync(OUT_FILE, JSON.stringify({ lastUpdated: new Date().toISOString(), events, last }, null, 2) + "\n");
  console.log(`Wrote ${events.length} upcoming and ${last.length} last events to ${OUT_FILE}`);
}
if (unreadable === GROUPS.length) {
  console.error("Meetup could not be read for any group: failing the run so it shows up red.");
  process.exitCode = 1;
}
