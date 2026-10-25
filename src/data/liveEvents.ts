/**
 * Which events have a live stream player in /live/.
 *
 * `npm run live:sync` writes public/live/events/index.json with each synced
 * meetup's Meetup link and event id. An event card whose link is one of those
 * (from src/data/events.ts or from the fetched data/meetups.json) gets the
 * "Open the live stream" button without a hand edit. `liveEventId` in
 * events.ts still works and wins.
 */
import { useEffect, useState } from "react";

export type LiveIndex = { version: 1; events: { id: string; meetupUrl: string; title?: string; doorsOpen?: string }[] };

/** One form per Meetup event link: https, no www, no query or hash, trailing slash. */
export function normalizeMeetupUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return `https://${u.host.toLowerCase().replace(/^www\./, "")}${path.toLowerCase()}`;
  } catch {
    return null;
  }
}

/** Meetup link (normalized) to event id. */
export function liveIdsByUrl(index: LiveIndex | null): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of index?.events ?? []) {
    const key = normalizeMeetupUrl(e.meetupUrl);
    if (key && !map.has(key)) map.set(key, e.id);
  }
  return map;
}

let request: Promise<Map<string, string>> | null = null;

/** Fetched once per page load; a missing or broken index means no extra buttons, never an error. */
function loadLiveIds(): Promise<Map<string, string>> {
  request ??= fetch(`${import.meta.env.BASE_URL}live/events/index.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? (r.json() as Promise<LiveIndex>) : null))
    .then(liveIdsByUrl)
    .catch(() => new Map<string, string>());
  return request;
}

/** The live event id for a card: its own liveEventId, else the one whose Meetup link matches. */
export function useLiveEventId(link: string | undefined, liveEventId: string | undefined): string | undefined {
  const [ids, setIds] = useState<Map<string, string> | null>(null);
  useEffect(() => {
    if (liveEventId || !link) return;
    let cancelled = false;
    loadLiveIds().then((m) => {
      if (!cancelled) setIds(m);
    });
    return () => {
      cancelled = true;
    };
  }, [link, liveEventId]);
  if (liveEventId) return liveEventId;
  const key = link ? normalizeMeetupUrl(link) : null;
  return key ? ids?.get(key) : undefined;
}
