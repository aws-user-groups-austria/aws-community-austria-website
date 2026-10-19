/**
 * Dates, paths and labels for the meetup pages, shared by the React pages and
 * the build-time prerender (scripts/prerender-meetups.mjs). Plain JavaScript
 * so Node runs it without a build step; types in meetupFormat.d.ts.
 * Every date is shown in Europe/Vienna, whatever the visitor's time zone.
 */

export const TIME_ZONE = "Europe/Vienna";

const fmt = (options) => new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...options });
const LONG_DATE = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const SHORT_DATE = fmt({ day: "numeric", month: "long", year: "numeric" });
const TIME = fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const YEAR = fmt({ year: "numeric" });
const CLOCK = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });

/** "Tuesday, 20 October 2026" */
export const longDate = (iso) => LONG_DATE.format(new Date(iso)).replace(/^(\w+) /, "$1, ");
/** "20 October 2026" */
export const shortDate = (iso) => SHORT_DATE.format(new Date(iso));
/** "17:00" */
export const time = (iso) => TIME.format(new Date(iso));
/** "18:10:30": the Vienna clock time a number of seconds after `iso`, as the room screen's ?at= takes it. */
export const clockAt = (iso, plusSeconds = 0) => CLOCK.format(new Date(Date.parse(iso) + plusSeconds * 1000));
/** 2026 */
export const year = (iso) => Number(YEAR.format(new Date(iso)));

const PARTS = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** { weekday: "Tuesday", day: "20", month: "October", year: "2026" } */
export function dateParts(iso) {
  const out = {};
  for (const p of PARTS.formatToParts(new Date(iso))) if (p.type !== "literal") out[p.type] = p.value;
  return out;
}

/** A map search for the venue (a link the visitor follows, nothing is fetched here). */
export function mapsUrl(venue) {
  const q = [venue.name, venue.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** "17:00 to 22:00" or "17:00" */
export function timeRange(start, end) {
  return end ? `${time(start)} to ${time(end)}` : time(start);
}

/** Coming until the meetup has ended (start plus four hours when it has no end). */
export function isComing(m, now = Date.now()) {
  const end = m.end ? Date.parse(m.end) : Date.parse(m.start) + 4 * 3600_000;
  return end >= now;
}

export const meetupPath = (id) => `/meetups/${id}/`;
/** The room screen for a meetup: /present/?event=<id>, optionally from a rehearsal time ("17:55") and faster. */
export function presentPath(id, at, speed) {
  const q = new URLSearchParams({ event: id });
  if (at) q.set("at", at);
  if (speed) q.set("speed", String(speed));
  return `/present/?${q.toString().replace(/%3A/g, ":")}`;
}

/** The meetup page's live header: the room-screen player in embed mode (real clock only, a tour before and after the evening). */
export const headerPath = (id) => `/present/?event=${encodeURIComponent(id)}&embed=1`;

/** "Roman Jokel, Cloud Architect, Raiffeisen Bank International" */
export function speakerLabel(s) {
  return [s.name, s.role, s.company].filter(Boolean).join(", ");
}

/** "Hosted by RBI", "Hosted by A and B", or "" */
export function hostsLabel(hosts) {
  const names = (hosts ?? []).map((h) => h.name).filter(Boolean);
  if (names.length === 0) return "";
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Hosted by ${list}`;
}

/** Coming meetups (soonest first), then past ones grouped by year (newest first). */
export function groupMeetups(meetups, now = Date.now()) {
  const coming = meetups.filter((m) => isComing(m, now)).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const past = meetups.filter((m) => !isComing(m, now)).sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  const years = [];
  for (const m of past) {
    const y = year(m.start);
    const last = years[years.length - 1];
    if (last && last.year === y) last.meetups.push(m);
    else years.push({ year: y, meetups: [m] });
  }
  return { coming, years };
}
