/**
 * Fetches the upcoming events of all AWS UG Austria groups from Meetup and
 * saves them to public/data/meetups.json. Runs via GitHub Actions every day.
 *
 * The RSS feed gives the event links only: its pubDate is when an event was
 * announced, not when it takes place. So each event page is read for its
 * JSON-LD Event (startDate, name, location), and only events that have not
 * started yet are kept.
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

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Event links from a group's RSS feed. */
function rssLinks(xml) {
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

/** The latest past event of a group, from its past-events page; undefined when the page cannot be read. */
async function lastEvent(group) {
  let html;
  try {
    html = await get(`https://www.meetup.com/${group.urlname}/events/?type=past`);
  } catch (err) {
    console.error(`Failed to read the past events of ${group.name}: ${err.message}`);
    return undefined;
  }
  const m = /<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!m) return undefined;
  let apollo;
  try {
    apollo = JSON.parse(m[1]).props?.pageProps?.__APOLLO_STATE__ ?? {};
  } catch {
    return undefined;
  }
  const now = Date.now();
  const past = Object.entries(apollo)
    .filter(([key, v]) => key.startsWith("Event:") && typeof v.eventUrl === "string" && typeof v.dateTime === "string" && Date.parse(v.dateTime) < now)
    .map(([, v]) => ({ title: String(v.title ?? "").trim(), link: v.eventUrl.endsWith("/") ? v.eventUrl : `${v.eventUrl}/`, date: new Date(v.dateTime).toISOString() }))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return past[0] ? { ...past[0], group: group.name, groupUrl: `https://www.meetup.com/${group.urlname}/` } : undefined;
}

async function fetchGroup(group) {
  let links;
  try {
    links = rssLinks(await get(`https://www.meetup.com/${group.urlname}/events/rss/`));
  } catch (err) {
    console.error(`Failed to read the feed of ${group.name}: ${err.message}`);
    return [];
  }
  const events = [];
  for (const link of links) {
    try {
      const ev = jsonLdEvent(await get(link));
      if (!ev?.startDate || !ev?.name) continue;
      const date = new Date(ev.startDate).toISOString();
      if (new Date(date) < new Date()) continue;
      events.push({ title: String(ev.name).trim(), link, date, venue: venueOf(ev), group: group.name, groupUrl: `https://www.meetup.com/${group.urlname}/` });
    } catch (err) {
      console.error(`Failed to read ${link}: ${err.message}`);
    }
  }
  return events;
}

const all = [];
for (const group of GROUPS) all.push(...(await fetchGroup(group)));
all.sort((a, b) => new Date(a.date) - new Date(b.date));
const events = all.slice(0, 6);

const previous = existsSync(OUT_FILE) ? JSON.parse(readFileSync(OUT_FILE, "utf8")) : { events: [] };
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
