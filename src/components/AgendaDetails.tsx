/**
 * The details behind a meetup's agenda: every agenda line and every speaker
 * opens a dialog with what the community knows about it. The talk with its
 * abstract and speakers (bio, LinkedIn), the doors with the Pac-Man rule, the
 * code of conduct and the organizers, the welcome with our user groups, the
 * badges and the community days we speak at, the host with what it does and
 * the meetups it hosted before, the break with the food, and the last
 * networking with the next meetup.
 *
 * <AgendaDetailsProvider> wraps a meetup page; the blocks in MeetupSections ask
 * useAgendaDetails() for openItem / openSpeaker (null outside the provider, so
 * they render as plain text there). The dialog is the native <dialog>: focus
 * stays inside, Escape and a click outside close it. Its address is the page's
 * hash (#agenda-talk-1, #speaker-roman-jokel), so a link can open it.
 *
 * Opening never moves the page: the scroll lock is on <html> (the page's
 * scroller), and the scrollbar keeps its space. The dialog grows out of the
 * point that was clicked and shrinks back into it on close; on a phone it
 * slides up as a sheet; with reduced motion it only fades.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { COMMUNITY_DAYS, communityDayPictures, type CommunityDay } from "../data/events";
import { CLOUD_CLUBS, ORGANIZERS, USER_GROUPS } from "../data/groups";
import { MEETUPS, type AgendaItem, type Meetup, type MeetupSpeaker } from "../data/meetups";
import { findCompany, type Company } from "../data/sponsors";
import { longDate, meetupPath, shortDate, time, timeRange } from "../lib/meetupFormat.js";
import { HostLogo } from "./HostLogo";
import { StudentIcon } from "./StudentIcon";
import { Markdown } from "./Markdown";

export const SESSIONIZE_URL = "https://sessionize.com/aws-community-austria";
const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;

/** "roman-jokel" for "Roman Jokel", "darko-mesaros" for "Darko Mesaroš". */
export const personSlug = (name: string) =>
  name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** One agenda line's label: the closing networking says how long people can stay. */
export function agendaTitle(a: AgendaItem): string {
  const title = a.talk?.title ?? a.title;
  return a.kind === "closing" ? `${title} until ${time(a.end)}` : title;
}

const KIND_LABEL: Record<AgendaItem["kind"], string> = {
  networking: "Doors open",
  welcome: "Welcome",
  sponsor: "Our host",
  talk: "Talk",
  break: "Break",
  closing: "Networking",
};

type Open = { item: string } | { speaker: string } | null;
type Api = { openItem: (id: string) => void; openSpeaker: (name: string) => void };
const Ctx = createContext<Api | null>(null);

/** openItem / openSpeaker, or null outside a meetup page. */
export const useAgendaDetails = () => useContext(Ctx);

/** Every speaker of the evening once, by slug, with the agenda lines they speak in. */
function speakersOf(m: Meetup) {
  const map = new Map<string, { speaker: MeetupSpeaker; items: AgendaItem[] }>();
  for (const a of m.evening?.agenda ?? []) {
    for (const s of a.talk?.speakers ?? []) {
      const slug = personSlug(s.name);
      const hit = map.get(slug);
      if (hit) hit.items.push(a);
      else map.set(slug, { speaker: s, items: [a] });
    }
  }
  return map;
}

function fromHash(hash: string): Open {
  const item = /^#agenda-([a-z0-9-]+)$/.exec(hash)?.[1];
  if (item) return { item };
  const speaker = /^#speaker-([a-z0-9-]+)$/.exec(hash)?.[1];
  return speaker ? { speaker } : null;
}

export function AgendaDetailsProvider({ m, children }: { m: Meetup; children: ReactNode }) {
  const [open, setOpen] = useState<Open>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const speakers = useMemo(() => speakersOf(m), [m]);
  const agenda = m.evening?.agenda ?? [];

  // Where the dialog grows from: the last click or tap, or the focused element for the keyboard.
  const origin = useRef<{ x: number; y: number } | null>(null);
  const closing = useRef(false);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      origin.current = { x: e.clientX, y: e.clientY };
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const r = (document.activeElement as HTMLElement | null)?.getBoundingClientRect();
      if (r) origin.current = { x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2 };
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("keydown", key, true);
    };
  }, []);

  const show = useCallback((next: Open) => {
    setOpen(next);
    const hash = next ? ("item" in next ? `#agenda-${next.item}` : `#speaker-${next.speaker}`) : "";
    if (window.location.hash !== hash) window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash}`);
  }, []);

  // A link with #agenda-<id> or #speaker-<name> opens that dialog.
  useEffect(() => {
    const read = () => setOpen(fromHash(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [m.id]);

  const item = open && "item" in open ? agenda.find((a) => a.id === open.item) : undefined;
  const person = open && "speaker" in open ? speakers.get(open.speaker) : undefined;
  const visible = Boolean(item || person);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (visible && !d.open) {
      d.showModal();
      d.querySelector(".agenda-dialog-body")?.scrollTo(0, 0);
      animate(d, motion(d, origin.current), OPEN);
    } else if (visible) {
      d.querySelector(".agenda-dialog-body")?.scrollTo(0, 0);
    }
    if (!visible && d.open) d.close();
  }, [visible, item, person]);

  /** Shrinks the dialog back to where it came from, then closes it. */
  const close = useCallback(() => {
    const d = ref.current;
    if (!d?.open || closing.current) return show(null);
    closing.current = true;
    const done = () => {
      closing.current = false;
      d.close();
      // the backdrop's fade is the dialog's subtree, and its "forwards" fill would keep it invisible next time
      d.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      show(null);
    };
    const run = animate(d, [...motion(d, null, true)].reverse(), CLOSE);
    if (run) run.finished.then(done, done);
    else done();
  }, [show]);

  const api = useMemo<Api>(
    () => ({ openItem: (id) => show({ item: id }), openSpeaker: (name) => show({ speaker: personSlug(name) }) }),
    [show],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <dialog
        ref={ref}
        className="agenda-dialog"
        aria-labelledby="agenda-dialog-title"
        // The close event comes a moment later: when a link has opened the dialog again by then, it stays open.
        onClose={() => !closing.current && !ref.current?.open && show(null)}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="agenda-dialog-panel">
          <button type="button" className="agenda-dialog-close" onClick={close} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="agenda-dialog-body">
            {item && <ItemDetails m={m} a={item} />}
            {person && <SpeakerDetails speaker={person.speaker} items={person.items} />}
            {visible && <GetInvolved />}
          </div>
        </div>
      </dialog>
    </Ctx.Provider>
  );
}

const OPEN: KeyframeAnimationOptions = { duration: 280, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" };
const CLOSE: KeyframeAnimationOptions = { duration: 180, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" };
const matches = (q: string) => typeof window.matchMedia === "function" && window.matchMedia(q).matches;

/**
 * The dialog's way in (reversed: its way out). Wide screens: from the clicked
 * point, small and transparent, to full size; a phone: up from the bottom edge;
 * reduced motion: a fade. `keep` leaves the transform origin of the opening.
 */
function motion(d: HTMLDialogElement, from: { x: number; y: number } | null, keep = false): Keyframe[] {
  if (matches("(prefers-reduced-motion: reduce)")) return [{ opacity: 0 }, { opacity: 1 }];
  if (matches("(max-width: 640px)")) return [{ transform: "translateY(100%)" }, { transform: "none" }];
  if (!keep) {
    const r = d.getBoundingClientRect();
    d.style.transformOrigin = from ? `${Math.round(from.x - r.left)}px ${Math.round(from.y - r.top)}px` : "";
  }
  return [{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "none" }];
}

/** Runs the motion on the dialog and a fade on its backdrop; nothing where the browser has no animations. */
function animate(d: HTMLDialogElement, frames: Keyframe[], options: KeyframeAnimationOptions): Animation | undefined {
  if (typeof d.animate !== "function") return undefined;
  const fade = frames[0]!.opacity === 1 ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
  try {
    d.animate(fade, { ...options, pseudoElement: "::backdrop" });
  } catch {
    // no animations on ::backdrop in this browser: it just appears
  }
  return d.animate(frames, options);
}

function Head({ label, title }: { label: string; title: string }) {
  return (
    <header className="agenda-dialog-head">
      <span className="label">{label}</span>
      <h2 id="agenda-dialog-title">{title}</h2>
    </header>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="agenda-dialog-block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ItemDetails({ m, a }: { m: Meetup; a: AgendaItem }) {
  return (
    <>
      <Head label={`${timeRange(a.start, a.end)} · ${KIND_LABEL[a.kind]}`} title={agendaTitle(a)} />
      {a.kind === "networking" && <DoorsDetails m={m} a={a} />}
      {a.kind === "welcome" && <WelcomeDetails m={m} />}
      {a.kind === "sponsor" && <SponsorDetails m={m} />}
      {a.kind === "talk" && a.talk && <TalkDetails talk={a.talk} />}
      {a.kind === "break" && <BreakDetails m={m} a={a} />}
      {a.kind === "closing" && <ClosingDetails m={m} a={a} />}
    </>
  );
}

/* ── Talks and speakers ───────────────────────────────────── */

function LinkIcon({ title }: { title: string }) {
  if (title === "LinkedIn") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** Photo, name, role, bio and profile links of one speaker. */
function SpeakerProfile({ s, heading = "h3" }: { s: MeetupSpeaker; heading?: "h2" | "h3" }) {
  const detail = [s.role, s.company].filter(Boolean).join(", ");
  const Name = heading;
  return (
    <article className="speaker-profile">
      <div className="speaker-profile-head">
        {s.photo && <img src={s.photo} alt="" className="speaker-profile-photo" />}
        <div>
          <Name className="speaker-profile-name" id={heading === "h2" ? "agenda-dialog-title" : undefined}>{s.name}</Name>
          {detail && <div className="speaker-detail">{detail}</div>}
          {s.links && s.links.length > 0 && (
            <div className="speaker-profile-links">
              {s.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="profile-link">
                  <LinkIcon title={l.title} />
                  {l.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {s.bio && <Markdown source={s.bio} className="prose speaker-profile-bio" />}
    </article>
  );
}

function TalkDetails({ talk }: { talk: NonNullable<AgendaItem["talk"]> }) {
  return (
    <>
      {talk.abstract && <Markdown source={talk.abstract} className="prose" />}
      {talk.speakers.length > 0 && (
        <Block title={talk.speakers.length > 1 ? "The speakers" : "The speaker"}>
          <div className="speaker-profiles">
            {talk.speakers.map((s) => <SpeakerProfile key={s.name} s={s} />)}
          </div>
        </Block>
      )}
    </>
  );
}

function SpeakerDetails({ speaker, items }: { speaker: MeetupSpeaker; items: AgendaItem[] }) {
  const details = useAgendaDetails();
  return (
    <>
      <header className="agenda-dialog-head">
        <span className="label">Speaker</span>
      </header>
      <SpeakerProfile s={speaker} heading="h2" />
      <Block title={items.length > 1 ? "Talks" : "Talk"}>
        <ul className="dialog-list">
          {items.map((a) => (
            <li key={a.id}>
              <button type="button" className="dialog-list-button" onClick={() => details?.openItem(a.id)}>
                <span className="label">{timeRange(a.start, a.end)}</span>
                <span className="dialog-list-title">{a.talk?.title ?? a.title}</span>
                <span className="text-link">About the talk &rarr;</span>
              </button>
            </li>
          ))}
        </ul>
      </Block>
    </>
  );
}

/* ── Doors, break, closing ────────────────────────────────── */

/** People standing in a circle with a gap, like Pac-Man's open mouth, and one walking in. */
function PacmanCircle() {
  const people = Array.from({ length: 7 }, (_, i) => {
    const angle = ((40 + (i * 280) / 6) * Math.PI) / 180;
    return { x: 60 + 34 * Math.cos(angle), y: 60 - 34 * Math.sin(angle) };
  });
  return (
    <svg className="pacman-circle" viewBox="0 0 160 120" role="img" aria-label="A group standing in a circle with a gap, and a person walking into the gap">
      <path d="M60 60 L91.5 41 A36 36 0 1 0 91.5 79 Z" fill="var(--color-accent-dim)" />
      {people.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="8" fill="var(--color-accent)" />)}
      <circle cx="132" cy="60" r="8" fill="var(--color-text)" />
      <path d="M118 60 H102" stroke="var(--color-text)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M107 54 L101 60 L107 66" stroke="var(--color-text)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PacmanRule() {
  return (
    <Block title="Stand like Pac-Man">
      <div className="pacman">
        <PacmanCircle />
        <div>
          <p>
            When you stand and talk in a group, leave a gap in your circle, like Pac-Man&apos;s open mouth. The gap says
            there is room for one more: anyone can walk up and join the conversation.
          </p>
          <p>When someone joins, move a little so the gap stays open for the next person. On your own? Look for a gap and walk in - you are welcome.</p>
        </div>
      </div>
    </Block>
  );
}

function Conduct({ m }: { m: Meetup }) {
  const c = m.evening?.conduct;
  const link = m.evening?.codeOfConduct;
  if (!c && !link) return null;
  return (
    <Block title={c ? `${c.title}${c.subtitle ? `: ${c.subtitle}` : ""}` : "Code of conduct"}>
      {c && c.lines.length > 0 && (
        <ul className="conduct-lines">
          {c.lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}
      <p>
        Everyone at the meetup agrees to our{" "}
        {link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-link">code of conduct</a> : "code of conduct"}.
        If something feels wrong, talk to any of the organizers.
      </p>
      <Leaders />
    </Block>
  );
}

/** The user group leaders, small: photo and first name, each linked to LinkedIn. Shown wherever a dialog tells people to ask them. */
function Leaders() {
  return (
    <ul className="leader-chips" aria-label="The user group leaders">
      {ORGANIZERS.map((o) => {
        const face = (
          <>
            {o.photo && <img src={asset(o.photo)} alt="" />}
            <span>{o.name.split(" ")[0]}</span>
          </>
        );
        return (
          <li key={o.name} title={o.name}>
            {o.linkedin ? <a href={o.linkedin} target="_blank" rel="noopener noreferrer" className="leader-chip">{face}</a> : <span className="leader-chip">{face}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** The leaders introduced at the welcome: a bigger photo, the name and their role, each linked to LinkedIn. */
function LeaderCards() {
  return (
    <ul className="leader-cards">
      {ORGANIZERS.map((o) => {
        const body = (
          <>
            {o.photo && <img src={asset(o.photo)} alt="" />}
            <span className="leader-card-text">
              <span className="leader-card-name">{o.name}</span>
              <span className="leader-card-role">{o.short}</span>
            </span>
          </>
        );
        return (
          <li key={o.name}>
            {o.linkedin ? <a href={o.linkedin} target="_blank" rel="noopener noreferrer" className="leader-card">{body}</a> : <span className="leader-card">{body}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Organizers() {
  return (
    <Block title="The organizers">
      <p>Questions, ideas, or something feels wrong? Talk to any of us - look for the Leader badge.</p>
      <Link to="/team/" className="text-link">Meet the team &rarr;</Link>
    </Block>
  );
}

function DoorsDetails({ m, a }: { m: Meetup; a: AgendaItem }) {
  const talk = m.evening?.agenda.find((x) => x.kind === "talk" || x.kind === "welcome");
  return (
    <>
      <p className="agenda-dialog-lead">
        Doors open at {time(a.start)}. Get a drink, say hi and meet the community{talk ? ` before the program starts at ${time(talk.start)}` : ""}.
      </p>
      <PacmanRule />
      <Conduct m={m} />
      <Organizers />
    </>
  );
}

const minutes = (a: AgendaItem) => Math.round((Date.parse(a.end) - Date.parse(a.start)) / 60000);

function BreakDetails({ m, a }: { m: Meetup; a: AgendaItem }) {
  const next = m.evening?.agenda.find((x) => Date.parse(x.start) >= Date.parse(a.end));
  return (
    <>
      <p className="agenda-dialog-lead">
        {minutes(a)} minutes to eat, drink and talk{next ? `. ${next.kind === "talk" ? "The next talk" : agendaTitle(next)} starts at ${time(next.start)}` : ""}.
      </p>
      <Block title="Food for everyone">
        <p>
          There should be something for everyone: dishes with meat or fish, vegetarian and vegan. If you cannot find
          anything you can eat, ask the host or any of the user group leaders - look for the Host and Leader badges.
        </p>
        <Leaders />
      </Block>
      <PacmanRule />
    </>
  );
}

/** "Thank you to <host> for the location and the food tonight", with the host's logo. */
function HostThanks({ m }: { m: Meetup }) {
  const names = m.evening?.sponsors?.length ? m.evening.sponsors.map((s) => s.name) : m.hosts.map((h) => h.name);
  if (!names.length) return null;
  const shown = names.map((n) => findCompany(n)?.name ?? n.replace(/\s+(AG|GmbH)$/, ""));
  return (
    <Block title="Thank you to our host">
      <p>
        Thank you to {shown.join(" and ")} for the location and the food and drinks tonight - and for supporting the
        AWS community.
      </p>
      <div className="host-thanks-logos">
        {names.map((n) => <HostLogo key={n} name={n} height={36} link />)}
      </div>
    </Block>
  );
}

/** The next meetup after this one, any group: from the meetup pages. */
function nextMeetup(m: Meetup): Meetup | undefined {
  return [...MEETUPS].filter((x) => Date.parse(x.start) > Date.parse(m.start)).sort((x, y) => Date.parse(x.start) - Date.parse(y.start))[0];
}

function ClosingDetails({ m, a }: { m: Meetup; a: AgendaItem }) {
  const details = useAgendaDetails();
  const next = nextMeetup(m);
  return (
    <>
      <p className="agenda-dialog-lead">Stay, talk and connect until {time(a.end)}.</p>
      <HostThanks m={m} />
      <Block title="Thank you">
        <p>
          Thank you for coming, from all of us who organize the user group! Please give us feedback in the Meetup app,
          or come and talk to us directly - we read and hear every bit of it.
        </p>
        <Leaders />
        <a href={m.meetupUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Give feedback on Meetup</a>
      </Block>
      <Block title="Next meetup">
        {next ? (
          <Link to={meetupPath(next.id)} className="next-meetup" onClick={() => details && window.history.replaceState(window.history.state, "", window.location.pathname)}>
            <span className="label">{longDate(next.start)}</span>
            <span className="dialog-list-title">{next.title}</span>
            {next.venue && <span className="text-muted">{next.venue.name}</span>}
          </Link>
        ) : (
          <p>
            The next meetup is not planned yet. We are looking for a host and for speakers - maybe you or your company?
            Follow the group on <a href={m.group.url} target="_blank" rel="noopener noreferrer" className="text-link">Meetup</a> to hear first.
          </p>
        )}
      </Block>
    </>
  );
}

/* ── Welcome ──────────────────────────────────────────────── */

const viennaDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date(iso));

/** The community days still ahead on the meetup's date. */
const communityDaysAfter = (m: Meetup): CommunityDay[] => COMMUNITY_DAYS.filter((c) => c.lastDay >= viennaDay(m.start));

function CommunityDaySpeakers({ c }: { c: CommunityDay }) {
  if (!c.speakers?.length) return null;
  return (
    <span className="community-day-speakers">
      {c.speakers.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        const photo = typeof s === "string" ? ORGANIZERS.find((o) => o.name === s)?.photo : s.photo;
        return (
          <span key={name} className="community-day-speaker">
            {photo && <img src={asset(photo)} alt="" />}
            {name}
          </span>
        );
      })}
    </span>
  );
}

function WelcomeDetails({ m }: { m: Meetup }) {
  const badges = m.evening?.badges ?? [];
  const days = communityDaysAfter(m);
  return (
    <>
      <p className="agenda-dialog-lead">
        {m.group.name} is one of the user groups of AWS Community Austria, run by volunteers. Our meetups are free and open
        to everyone who is interested in AWS.
      </p>
      <div className="agenda-dialog-leaders">
        <span className="label">Your user group leaders</span>
        <LeaderCards />
      </div>
      <Block title="Our user groups">
        <ul className="group-tiles">
          {USER_GROUPS.map((g) => (
            <li key={g.id}>
              <Link to={`/group/${g.id}/`} className="group-tile">
                <img src={g.logoWide} alt="" />
                <span>
                  <span className="dialog-list-title">{g.name}</span>
                  <span className="text-muted">{g.city}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Block>
      <Block title="AWS Student Builder Groups">
        <ul className="group-tiles">
          {CLOUD_CLUBS.map((c) => (
            <li key={c.id}>
              <a href={c.meetupUrl} target="_blank" rel="noopener noreferrer" className="group-tile">
                <span className="group-tile-icon"><StudentIcon size={28} /></span>
                <span>
                  <span className="dialog-list-title">{c.name}</span>
                  <span className="text-muted">{c.city}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Block>
      {badges.length > 0 && (
        <Block title="Our badges">
          <p>Look out for the badges at the meetup: they show who is new, who is here again, and who to ask.</p>
          <ul className="badge-grid">
            {badges.map((b) => (
              <li key={b.name}>
                {b.image && <img src={b.image} alt="" />}
                <span className="dialog-list-title">{b.name}</span>
                <span className="badge-grid-title">{b.title}</span>
                {b.text && <span className="text-muted">{b.text}</span>}
              </li>
            ))}
          </ul>
        </Block>
      )}
      <Block title="AWS Community Days">
        <p>
          We support AWS Community Days across Europe and speak there. AWS Community Day DACH is organized by Förderverein
          AWS Community DACH e.V., the non-profit chaired by our co-organizer Linda Mohamed.
        </p>
        {days.length > 0 && (
          <ul className="dialog-list">
            {days.map((c) => (
              <li key={c.name}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="dialog-list-button cd-row">
                  {communityDayPictures(c) && (
                    <span className="cd-row-pics">
                      <img src={communityDayPictures(c)!.screenshot} alt={`The website of ${c.name}`} className="cd-row-shot" />
                      <img src={communityDayPictures(c)!.qr} alt={`QR code to ${c.url}`} className="cd-row-qr" />
                    </span>
                  )}
                  <span className="label">{c.date}</span>
                  <span className="dialog-list-title">{c.name}</span>
                  <span className="text-muted">{c.location}</span>
                  {c.speakers?.length ? <span className="community-day-with">Speaking there:</span> : null}
                  <CommunityDaySpeakers c={c} />
                  <span className="text-link cd-row-url">{c.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} &rarr;</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </>
  );
}

/* ── The host ─────────────────────────────────────────────── */

function SponsorDetails({ m }: { m: Meetup }) {
  const details = useAgendaDetails();
  const names = m.evening?.sponsors?.length ? m.evening.sponsors.map((s) => s.name) : m.hosts.map((h) => h.name);
  const companies = names.map((n) => ({ name: n, company: findCompany(n) }));
  return (
    <>
      <p className="agenda-dialog-lead">
        Thank you to {companies.map((c) => c.company?.name ?? c.name).join(" and ")} for hosting this meetup and making it possible.
      </p>
      {companies.map(({ name, company }) => (
        <HostBlock key={name} name={name} company={company} m={m} onNavigate={() => details && window.history.replaceState(window.history.state, "", window.location.pathname)} />
      ))}
    </>
  );
}

function HostBlock({ name, company, m, onNavigate }: { name: string; company?: Company; m: Meetup; onNavigate: () => void }) {
  const earlier = company
    ? MEETUPS.filter((x) => x.id !== m.id && x.hosts.some((h) => findCompany(h.name) === company)).sort((x, y) => Date.parse(y.start) - Date.parse(x.start))
    : [];
  return (
    <section className="agenda-dialog-block host-block">
      <div className="host-block-head">
        <HostLogo name={name} height={40} link />
        {company && (
          <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-link">
            {company.url.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        )}
      </div>
      {company?.about && <p>{company.about}</p>}
      {company?.aws && (
        <>
          <h3>{company.name} and AWS</h3>
          <p>{company.aws}</p>
        </>
      )}
      {earlier.length > 0 && (
        <>
          <h3>Also hosted</h3>
          <ul className="dialog-list">
            {earlier.map((x) => (
              <li key={x.id}>
                <Link to={meetupPath(x.id)} className="dialog-list-button" onClick={onNavigate}>
                  <span className="label">{shortDate(x.start)}</span>
                  <span className="dialog-list-title">{x.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/* ── Every dialog ends with ───────────────────────────────── */

function GetInvolved() {
  return (
    <aside className="get-involved">
      <h3>Get involved</h3>
      <div className="get-involved-actions">
        <a href={SESSIONIZE_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Become a speaker</a>
        <Link to="/prep-guide/" className="btn btn-outline btn-sm">Host a meetup: prep guide</Link>
      </div>
      <p className="text-muted">Submit a talk on Sessionize, or read the prep guide to host or support one of our meetups.</p>
    </aside>
  );
}
