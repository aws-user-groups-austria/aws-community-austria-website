/**
 * The building blocks of a meetup page (/meetups/<id>/), shared by its three
 * designs in src/pages/MeetupPage.tsx. Every block renders only from real
 * data and renders nothing when the data is not there: no placeholders, no
 * empty sections.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AgendaItem, Meetup, MeetupSpeaker, Talk } from "../data/meetups";
import { clockAt, dateParts, headerPath, isComing, longDate, mapsUrl, presentPath, time, timeRange } from "../lib/meetupFormat.js";
import { agendaTitle, useAgendaDetails } from "./AgendaDetails";
import { HostLine } from "./HostLogo";
import { Markdown } from "./Markdown";

const iconProps = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", strokeWidth: 2,
  strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: "4px" },
} as const;
export const ClockIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
export const PinIcon = () => (
  <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

/** A section with the page's heading style; nothing when it has no content. */
export function Section({ title, children, surface = false, id }: { title: string; children: ReactNode; surface?: boolean; id?: string }) {
  return (
    <section className={`meetup-section${surface ? " bg-surface" : ""}`} id={id}>
      <div className="container">
        <h2 className="meetups-heading">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function BackLink() {
  return <Link to="/meetups/" className="back-link">&larr; All meetups</Link>;
}

/** "Coming up · AWS User Group Vienna" */
export function Kicker({ m }: { m: Meetup }) {
  return <span className="label">{isComing(m) ? "Coming up" : "Past meetup"} &middot; {m.group.name}</span>;
}

export function WhenFact({ m }: { m: Meetup }) {
  return (
    <div className="meetup-fact">
      <ClockIcon />
      <span>
        {longDate(m.start)}
        <br />
        <span className="text-muted">{timeRange(m.start, m.end)} (Vienna time)</span>
      </span>
    </div>
  );
}

export function WhereFact({ m, mapsLabel = "Open in maps" }: { m: Meetup; mapsLabel?: string }) {
  if (!m.venue) return null;
  return (
    <div className="meetup-fact">
      <PinIcon />
      <span>
        {m.venue.name}
        {m.venue.address && (
          <>
            <br />
            <span className="text-muted">{m.venue.address}</span>
          </>
        )}
        <br />
        <a href={mapsUrl(m.venue)} target="_blank" rel="noopener noreferrer" className="text-link meetup-maps-link">{mapsLabel}</a>
      </span>
    </div>
  );
}

export function Hosts({ m, height = 40, label }: { m: Meetup; height?: number; label?: string | null }) {
  return <HostLine hosts={m.hosts.map((h) => h.name)} height={height} link label={label} />;
}

export function RsvpButton({ m, className = "btn btn-primary btn-md" }: { m: Meetup; className?: string }) {
  return (
    <a href={m.meetupUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {isComing(m) ? "RSVP on Meetup" : "View on Meetup"}
    </a>
  );
}

/**
 * The header's picture. A meetup with an agenda gets the live header: the
 * room screen in embed mode, which tours the evening with a "Starts in"
 * countdown until doors open, shows what is on during the evening, and lets
 * visitors click around (it goes back by itself). Otherwise the Meetup header
 * image; nothing when there is neither.
 */
export function HeaderImage({ m, className }: { m: Meetup; className: string }) {
  if (m.stream) return <LiveHeader m={m} className={className} />;
  if (!m.image) return null;
  return <img src={m.image} alt="" className={className} referrerPolicy="no-referrer" />;
}

/**
 * The live header and its fullscreen button. Fullscreen is the header itself
 * (the loop, letterboxed to 16:9); where a browser cannot show a part of a page
 * fullscreen (iPhone Safari), the button opens the loop on its own in a new tab.
 */
function LiveHeader({ m, className }: { m: Meetup; className: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggle = () => {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => window.open(headerPath(m.id), "_blank", "noopener"));
    } else {
      window.open(headerPath(m.id), "_blank", "noopener");
    }
  };
  return (
    <div ref={box} className={`${className} live-header${full ? " live-header-full" : ""}`}>
      <iframe src={headerPath(m.id)} title={`${m.title}: the evening, live`} allow="fullscreen" />
      <button type="button" className="live-header-full-button" onClick={toggle} aria-label={full ? "Exit fullscreen" : "Show the loop fullscreen"} title={full ? "Exit fullscreen (Esc)" : "Fullscreen"}>
        {full ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" /></svg>
        )}
        <span>{full ? "Exit" : "Fullscreen"}</span>
      </button>
    </div>
  );
}

/** RSVP (or the event on Meetup, once it is over) as a small link, not a big button: the page is about the evening. */
export function RsvpLink({ m }: { m: Meetup }) {
  return (
    <a href={m.meetupUrl} target="_blank" rel="noopener noreferrer" className="meetup-rsvp-link">
      {isComing(m) ? "RSVP on Meetup" : "This meetup on Meetup"} <span aria-hidden="true">&rarr;</span>
    </a>
  );
}

/** A large date: weekday, day number, month and year. */
export function DateBlock({ iso }: { iso: string }) {
  const p = dateParts(iso);
  return (
    <div className="date-block" aria-label={longDate(iso)}>
      <span className="date-block-weekday">{p.weekday}</span>
      <span className="date-block-day">{p.day}</span>
      <span className="date-block-month">{p.month} {p.year}</span>
    </div>
  );
}

/** "Cloud Architect, Raiffeisen Bank International" */
const speakerDetail = (s: MeetupSpeaker) => [s.role, s.company].filter(Boolean).join(", ");

/** A speaker with photo (only when there is one), name, role and company; on a meetup page a button that opens the speaker's details. */
export function SpeakerRow({ s, size = 56 }: { s: MeetupSpeaker; size?: number }) {
  const details = useAgendaDetails();
  const inner = (
    <>
      {s.photo && <img src={s.photo} alt="" className="speaker-photo" style={{ width: size, height: size }} />}
      <div>
        <div className="speaker-name">{s.name}</div>
        {speakerDetail(s) && <div className="speaker-detail">{speakerDetail(s)}</div>}
      </div>
    </>
  );
  if (!details) return <div className="speaker-row">{inner}</div>;
  return (
    <button type="button" className="speaker-row speaker-row-button" onClick={() => details.openSpeaker(s.name)} aria-label={`About ${s.name}`}>
      {inner}
    </button>
  );
}

/** A talk: time (when known), title, speakers, abstract. With its agenda id, on a meetup page, the title opens the talk's details. */
export function TalkBlock({ t, photoSize = 56, showTime = true, itemId }: { t: Talk; photoSize?: number; showTime?: boolean; itemId?: string }) {
  const details = useAgendaDetails();
  const id = itemId ?? t.id;
  return (
    <article className="talk-block">
      {showTime && t.start && <span className="label">{timeRange(t.start, t.end)}</span>}
      <h3 className="talk-block-title">
        {details && id ? (
          <button type="button" className="agenda-open" onClick={() => details.openItem(id)}>
            {t.title}
            <Chevron />
          </button>
        ) : (
          t.title
        )}
      </h3>
      {t.speakers.length > 0 && (
        <div className="talk-block-speakers">
          {t.speakers.map((s) => <SpeakerRow key={s.name} s={s} size={photoSize} />)}
        </div>
      )}
      {t.abstract && <Markdown source={t.abstract} className="prose talk-abstract" />}
    </article>
  );
}

const Chevron = () => (
  <svg className="agenda-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** The speakers of an agenda line, each a button to their details on a meetup page. */
function AgendaSpeakers({ speakers }: { speakers: MeetupSpeaker[] }) {
  const details = useAgendaDetails();
  if (!speakers.length) return null;
  return (
    <span className="agenda-list-speakers">
      {speakers.map((s, i) => (
        <span key={s.name}>
          {i > 0 && ", "}
          {details ? (
            <button type="button" className="agenda-speaker" onClick={() => details.openSpeaker(s.name)}>{s.name}</button>
          ) : (
            s.name
          )}
        </span>
      ))}
    </span>
  );
}

/** The agenda as a list of times and titles; on a meetup page every line opens its details. */
export function AgendaList({ m, compact = false }: { m: Meetup; compact?: boolean }) {
  const details = useAgendaDetails();
  const agenda = m.evening?.agenda ?? [];
  if (!agenda.length) return null;
  return (
    <ol className={`agenda-list${compact ? " agenda-list-compact" : ""}${details ? " agenda-list-open" : ""}`}>
      {agenda.map((a) => (
        <li key={a.id} className={a.kind === "talk" ? "agenda-list-talk" : undefined}>
          <span className="agenda-list-time">{time(a.start)}</span>
          <span className="agenda-list-body">
            {details ? (
              <button type="button" className="agenda-list-title agenda-open" onClick={() => details.openItem(a.id)}>
                {agendaTitle(a)}
                <Chevron />
              </button>
            ) : (
              <span className="agenda-list-title">{agendaTitle(a)}</span>
            )}
            {a.talk && <AgendaSpeakers speakers={a.talk.speakers} />}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The evening as a vertical timeline, each talk expanded inline (design B). */
export function Timeline({ m }: { m: Meetup }) {
  const details = useAgendaDetails();
  const agenda = m.evening?.agenda ?? [];
  if (!agenda.length) return null;
  return (
    <ol className="timeline">
      {agenda.map((a) => (
        <li key={a.id} className={`timeline-item timeline-${a.kind}`}>
          <span className="timeline-time">{time(a.start)}</span>
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-body">
            {a.talk ? (
              <TalkBlock t={{ ...a.talk, start: a.start, end: a.end }} showTime={false} photoSize={64} itemId={a.id} />
            ) : details ? (
              <button type="button" className="timeline-title agenda-open" onClick={() => details.openItem(a.id)}>
                {agendaTitle(a)}
                <Chevron />
              </button>
            ) : (
              <div className="timeline-title">{agendaTitle(a)}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

const RULE = /^\s*(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:\\[-*]\s*){3,}|(?:_\s*){3,})$/;
const SECTION = /^[\s*_#\\]*(?:location|when|where|agenda|date|time|speakers?|sponsors?|event highlights|talks?)\b/i;
const AGENDA_LINE = /^[\s*+\-\u2022]*\**\s*\d{1,2}[:.]\d{2}/;
const TALK_TITLE = /^[\s*_#]*(?:["\u201c\u201e]|\d+\\?\.\s)/;
const TIME_ONLY = /^[\s*_]*(?:entry|start|doors?)\s*:\s*\d{1,2}[:.]\d{2}[\s*_]*$/i;

/**
 * The description's own intro: everything before its first separator, section
 * heading (Location, When, Agenda, ...), agenda line or talk title. Those parts
 * are on the page already (talks, agenda, good to know), so a meetup with an
 * agenda shows only this, with the full text folded below it.
 */
export function introOf(markdown: string): string {
  const out: string[] = [];
  for (const line of markdown.split("\n")) {
    if (RULE.test(line) || SECTION.test(line) || AGENDA_LINE.test(line) || TALK_TITLE.test(line)) break;
    if (!TIME_ONLY.test(line)) out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * The Meetup description. With an agenda: its intro, and the whole text behind
 * "Full description from Meetup" (talks, agenda and notices are on the page
 * already). Without one: the whole text, open or folded.
 */
export function About({ m, collapsible = false }: { m: Meetup; collapsible?: boolean }) {
  if (!m.description.trim()) return null;
  const intro = m.evening?.agenda.length ? introOf(m.description) : "";
  if (intro && intro.length < m.description.trim().length) {
    return (
      <div data-meetup-text>
        <Markdown source={intro} className="prose" />
        <details className="meetup-details">
          <summary>Full description from Meetup</summary>
          <Markdown source={m.description} className="prose" />
        </details>
      </div>
    );
  }
  if (!collapsible) return <div data-meetup-text><Markdown source={m.description} className="prose" /></div>;
  return (
    <details className="meetup-details" data-meetup-text>
      <summary>Full description from Meetup</summary>
      <Markdown source={m.description} className="prose" />
    </details>
  );
}

/** The photo and video notice and the code of conduct; nothing when the meetup has neither. */
export function GoodToKnow({ m }: { m: Meetup }) {
  const notices = m.evening?.notices ?? [];
  const coc = m.evening?.codeOfConduct;
  if (!notices.length && !coc) return null;
  return (
    <Section title="Good to know">
      <div className="good-to-know">
        {notices.map((n) => <p key={n}>{n}</p>)}
        {coc && (
          <p>
            With your RSVP you agree to our{" "}
            <a href={coc} target="_blank" rel="noopener noreferrer" className="text-link">code of conduct</a>.
          </p>
        )}
      </div>
    </Section>
  );
}

/** Photos, slides and recordings: each only when the meetup's media has entries. */
export function MediaSections({ m }: { m: Meetup }) {
  const photos = (m.media?.photos ?? []).filter((p) => /^(https?:\/\/|\/)/.test(p.src));
  const slides = m.media?.slides ?? [];
  const recordings = m.media?.recordings ?? [];
  return (
    <>
      {photos.length > 0 && (
        <Section title="Photos">
          <div className="photo-grid">
            {photos.map((p) => (
              <a key={p.src} href={p.src} target="_blank" rel="noopener noreferrer">
                <img src={p.src} alt={p.alt ?? ""} loading="lazy" />
              </a>
            ))}
          </div>
        </Section>
      )}
      {m.deck && (
        <Section title="Slide deck">
          <a href={m.deck} target="_blank" rel="noopener" className="deck-card">
            {m.deckCover && <img src={m.deckCover} alt={`First slide of the deck: ${m.title}`} loading="lazy" />}
            <span className="deck-card-text">
              <span className="dialog-list-title">The slides of the evening</span>
              <span className="text-muted">Our deck with the agenda, the talks and the host, as a PDF.</span>
              <span className="text-link">Open the PDF &rarr;</span>
            </span>
          </a>
        </Section>
      )}
      {slides.length > 0 && (
        <Section title="Slides of the talks">
          <ul className="media-list">
            {slides.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-link">{s.title}</a>
                {s.speaker && <span className="text-muted"> &middot; {s.speaker}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {recordings.length > 0 && (
        <Section title="Recordings">
          <ul className="media-list">
            {recordings.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-link">{r.title}</a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

/**
 * The moment the preview shows: 30 seconds into the first talk, while the
 * screen hands over to its speakers (the handover runs for the first 90
 * seconds of a talk); without a talk, 30 seconds into the welcome; else
 * 18:12. The player's clock then runs on in real time.
 */
export function previewMoment(m: Meetup): { at: string; label: string } {
  const agenda = m.evening?.agenda ?? [];
  const talk = agenda.find((a) => a.kind === "talk");
  if (talk) return { at: clockAt(talk.start, 30), label: `${time(talk.start)}, when the first talk begins` };
  const welcome = agenda.find((a) => a.kind === "welcome");
  if (welcome) return { at: clockAt(welcome.start, 30), label: `${time(welcome.start)}, at the welcome` };
  return { at: "18:12", label: "18:12" };
}

/**
 * The real room-screen player in a 16:9 frame, at a fixed moment of the
 * evening, not clickable. Only for meetups the room screen can show; loaded
 * when it scrolls into view.
 */
export function RoomScreenPreview({ m }: { m: Meetup }) {
  if (!m.stream) return null;
  const moment = previewMoment(m);
  return (
    <Section title="Preview of the room screen">
      <p className="text-secondary preview-caption">
        During the evening the screen in the room follows the agenda on its own. This is how it looks at {moment.label}.
      </p>
      <div className="room-preview">
        <iframe
          src={presentPath(m.id, moment.at)}
          title={`Preview of the room screen for ${m.title}`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </Section>
  );
}

/** A quiet line at the very bottom for the organizers: open or rehearse the room screen. */
export function OrganizersLine({ m }: { m: Meetup }) {
  if (!m.stream) return null;
  return (
    <div className="organizers-line">
      <div className="container">
        For organizers:{" "}
        <a href={presentPath(m.id)}>Present this meetup on the room screen</a>
        {" "}&middot;{" "}
        <a href={presentPath(m.id, "17:55", 10)}>rehearse from 17:55 at 10x speed</a>
        {" "}&middot;{" "}
        <a href={m.deck ?? "/organizers/#deck"}>{m.deck ? "slide deck (PDF)" : "slide deck"}</a>
        {" "}&middot;{" "}
        <Link to="/organizers/">how it works</Link>
      </div>
    </div>
  );
}
