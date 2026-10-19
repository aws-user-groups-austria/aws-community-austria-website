/**
 * Every meetup, past and coming, for /meetups/ and /meetups/<id>/.
 *
 * meetups.generated.json is written by `npm run meetups:sync` from each
 * meetup-event-vienna/events/<id>/meetup.json in the meetup stream workspace
 * (contract: "meetup.json (version 1)" in the workspace SPEC.md), newest
 * first. It is committed, so the build needs no sibling folder. Do not edit
 * it by hand: fix the source and sync again.
 */
import generated from "./meetups.generated.json";
import { normalizeMeetupUrl } from "../lib/meetupUrl";

export type ProfileLink = { title: string; url: string };

/** A speaker; bio and links (LinkedIn first) come from the agenda's event.json. */
export type MeetupSpeaker = { name: string; role?: string; company?: string; photo?: string; bio?: string; links?: ProfileLink[] };

/** A badge people wear at the meetup (First-Timer, All-Timer, ...), from the community data. */
export type Badge = { name: string; title: string; text?: string; image?: string };

/** One part of the evening, from the meetup's event.json (see scripts/meetups-sync.mjs). */
export type AgendaItem = {
  id: string;
  kind: "networking" | "welcome" | "sponsor" | "talk" | "break" | "closing";
  start: string;
  end: string;
  title: string;
  talk?: { title: string; abstract?: string; speakers: MeetupSpeaker[] };
};

/** The evening as planned: present when the meetup has an event.json. Photos are site paths under /present/. */
export type Evening = {
  doorsOpen: string;
  end: string;
  agenda: AgendaItem[];
  notices: string[];
  codeOfConduct?: string;
  /** The "Growing Together" lines of the code of conduct, as on the room screen. */
  conduct?: { title: string; subtitle?: string; lines: string[] };
  badges?: Badge[];
  sponsors?: { name: string; url?: string; logo?: string }[];
};

/** A talk as the pages show it: from the agenda when there is one (with times, abstract, photos), else from meetup.json. */
export type Talk = { id?: string; title: string; abstract?: string; speakers: MeetupSpeaker[]; start?: string; end?: string };

export type Meetup = {
  version: 1;
  id: string;
  title: string;
  number?: number;
  meetupUrl: string;
  start: string;
  end?: string;
  group: { id: string; name: string; url: string };
  venue?: { name: string; address?: string };
  hosts: { name: string }[];
  image?: string;
  summary: string;
  description: string;
  talks: { title: string; speakers: MeetupSpeaker[] }[];
  stream: boolean;
  evening?: Evening;
  /** The slide deck in our design, as a PDF (/decks/<id>.pdf), when one was made with `make deck`. */
  deck?: string;
  /** Its first slide as an image (/decks/<id>.png), the deck's preview. */
  deckCover?: string;
  media?: {
    photos?: { src: string; alt?: string }[];
    slides?: { title: string; url: string; speaker?: string }[];
    recordings?: { title: string; url: string }[];
  };
};

export const MEETUPS: Meetup[] = (generated as { meetups: Meetup[] }).meetups;

export function talksOf(m: Meetup): Talk[] {
  const fromAgenda = (m.evening?.agenda ?? []).filter((a) => a.talk).map((a) => ({ ...a.talk!, id: a.id, start: a.start, end: a.end }));
  return fromAgenda.length ? fromAgenda : m.talks;
}

export function findMeetup(id: string | undefined): Meetup | undefined {
  return id ? MEETUPS.find((m) => m.id === id) : undefined;
}

const BY_URL = new Map<string, Meetup>();
for (const m of MEETUPS) {
  const key = normalizeMeetupUrl(m.meetupUrl);
  if (key) BY_URL.set(key, m);
}

/** The meetup behind an event card: by its Meetup event link, else by id. */
export function meetupForEvent(link: string | undefined, id?: string): Meetup | undefined {
  const key = link ? normalizeMeetupUrl(link) : null;
  return (key ? BY_URL.get(key) : undefined) ?? findMeetup(id);
}
