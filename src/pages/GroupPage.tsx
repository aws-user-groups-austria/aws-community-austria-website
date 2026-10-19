import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { USER_GROUPS } from "../data/groups";
import { UPCOMING_EVENTS, type MeetupEvent } from "../data/events";
import { SpeakerLine, SponsorWanted } from "../components/EventExtras";
import { HostLine } from "../components/HostLogo";
import { MEETUPS, meetupForEvent } from "../data/meetups";
import { longDate, meetupPath, shortDate, timeRange } from "../lib/meetupFormat.js";

/** One event from public/data/meetups.json (written every day by scripts/fetch-meetups.mjs from Meetup). */
type LiveEvent = { title: string; link: string; date: string; venue?: string; group: string; groupUrl: string };
type LiveData = { events: LiveEvent[]; last?: LiveEvent[] };

const groupKey = (url: string) => url.replace(/^https?:\/\/(www\.)?meetup\.com\/(\w\w-\w\w\/)?/i, "").replace(/\/.*$/, "").toLowerCase();

const AGENDA = [
  { time: "17:00 - 18:00", label: "Entry & networking" },
  { time: "18:00 - 18:10", label: "Welcome & introduction" },
  { time: "18:10 - 18:20", label: "Sponsor introduction", highlight: true },
  { time: "18:20 - 19:00", label: "Talk 1" },
  { time: "19:00 - 19:20", label: "Break: food, drinks and networking" },
  { time: "19:20 - 20:00", label: "Talk 2" },
  { time: "20:00+",        label: "Networking" },
];

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const group = USER_GROUPS.find((g) => g.id === groupId);
  const [live, setLive] = useState<LiveData | null>(null);

  // The next meetup, and the last one, from Meetup: the site fetches them every day (public/data/meetups.json).
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/meetups.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLive(d))
      .catch(() => setLive(null));
  }, []);

  if (!group) {
    return (
      <div className="section-center" style={{ padding: "100px 40px", fontSize: "var(--font-size-lg)", color: "var(--color-text-secondary)" }}>
        <p>User group not found.</p>
        <Link to="/" className="text-link">Back to home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)",
        borderBottom: "3px solid var(--color-accent)",
        padding: "60px 0",
      }}>
        <div className="container">
          <Link to="/" className="back-link">&larr; Back to all groups</Link>

          <div>
            <div>
              <img
                src={group.logoWide}
                alt={group.name}
                style={{ height: "64px", objectFit: "contain", marginBottom: "var(--space-5)", display: "block" }}
              />
              <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: 900, color: "var(--color-text)", marginBottom: "var(--space-2)", lineHeight: 1.1 }}>
                {group.name}
              </h1>
              <div className="text-accent" style={{ fontSize: "var(--font-size-md)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
                {group.city}, Austria
              </div>
              <p className="text-secondary" style={{ fontSize: "var(--font-size-base)", lineHeight: 1.7, maxWidth: "640px", marginBottom: "var(--space-7)" }}>
                {group.description}
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <a href={group.meetupUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md">
                  Join on Meetup
                </a>
                <a href="https://sessionize.com/aws-community-austria" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-md">
                  Submit a Talk
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Typical agenda and the next (or last) meetup */}
      <section className="section-sm">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>

          {/* Agenda */}
          <div>
            <div className="accent-bar-sm" />
            <h2 className="subsection-title">Typical Meetup Agenda</h2>
            <div className="card" style={{ borderRadius: "var(--radius-lg)" }}>
              {AGENDA.map((item, i) => (
                <div key={i} className={`agenda-row${item.highlight ? " agenda-row-highlight" : ""}`}>
                  <div className="agenda-time">{item.time}</div>
                  <div style={{
                    fontSize: "var(--font-size-sm)",
                    color: item.highlight ? "var(--color-text)" : "var(--color-text-secondary)",
                    fontWeight: item.highlight ? 600 : 400,
                  }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The next meetup from Meetup, or the last one when no new one is planned yet */}
          <NextOrLastMeetup group={group} live={live} />
        </div>
      </section>

      {/* Host CTA */}
      <section className="section-sm bg-surface border-top-subtle section-center">
        <div className="container" style={{ maxWidth: "600px" }}>
          <div className="accent-bar" />
          <h2 className="subsection-title">Want to host a meetup?</h2>
          <p className="text-secondary" style={{ fontSize: "var(--font-size-base)", marginBottom: "var(--space-6)", lineHeight: 1.7 }}>
            We are always looking for companies to host our meetups. Provide a venue for 50-100 people with food and drinks, and we handle the rest.
          </p>
          <a href="/sponsors" className="btn btn-primary btn-lg">
            Learn about sponsorship
          </a>
        </div>
      </section>
    </>
  );
}

/** The group's next meetup on Meetup; when none is planned yet, its last one. */
function NextOrLastMeetup({ group, live }: { group: (typeof USER_GROUPS)[number]; live: LiveData | null }) {
  const key = groupKey(group.meetupUrl);
  const now = Date.now();
  const mine = (e: { groupUrl: string }) => groupKey(e.groupUrl) === key;
  const staticNext = UPCOMING_EVENTS.find((e) => e.groupId === group.id && e.date && Date.parse(e.date) > now);
  const next: (LiveEvent | MeetupEvent) | undefined = live?.events.filter(mine).find((e) => Date.parse(e.date) > now) ?? staticNext;
  // The last one: from Meetup, else from the meetup pages on this site.
  const archived = MEETUPS.filter((m) => groupKey(m.group.url) === key && Date.parse(m.start) < now)[0];
  const last: LiveEvent | undefined =
    live?.last?.find(mine) ?? (archived ? { title: archived.title, link: archived.meetupUrl, date: archived.start, venue: archived.venue?.name, group: group.shortName, groupUrl: group.meetupUrl } : undefined);
  const shown = next ?? last;
  const page = shown ? meetupForEvent(shown.link, undefined) : undefined;
  const isNext = Boolean(next);
  // The site's own card for the same event knows its speakers and whether a sponsor is wanted.
  const extra = isNext && staticNext && shown && shown.link.replace(/\/$/, "") === staticNext.link.replace(/\/$/, "") ? staticNext : undefined;
  return (
    <div>
      <div className="accent-bar-sm" />
      <h2 className="subsection-title">{isNext ? "Next meetup" : shown ? "Last meetup" : "Meetups"}</h2>
      {shown ? (
        <article className={`card-dark next-meetup-card${isNext ? " next-meetup-card-next" : ""}`}>
          <div className="card-header">
            <span className="label">{isNext ? "Coming up" : "No new date yet"} &middot; {shortDate(shown.date)}</span>
            <div className="next-meetup-card-title">
              {page ? <Link to={meetupPath(page.id)} className="card-title-link">{shown.title}</Link> : shown.title}
            </div>
          </div>
          <div className="card-body-flex">
            <div className="text-secondary">{longDate(shown.date)}{page?.end ? `, ${timeRange(page.start, page.end)}` : ""}</div>
            {shown.venue && <div className="text-muted">{shown.venue}</div>}
            {page && page.hosts.length > 0 && <HostLine hosts={page.hosts.map((h) => h.name)} height={30} />}
            {extra && <SpeakerLine label="With" speakers={extra.speakers} />}
            {extra && <SponsorWanted show={extra.sponsorWanted} />}
            {!isNext && <p className="text-muted next-meetup-card-note">The next one is not on Meetup yet. Join the group to hear about it first.</p>}
          </div>
          <div className="card-footer next-meetup-card-actions">
            <a href={isNext ? shown.link : group.meetupUrl} target="_blank" rel="noopener noreferrer" className="event-btn event-btn-filled">
              {isNext ? "RSVP on Meetup" : "Join the group on Meetup"}
            </a>
            {page ? (
              <Link to={meetupPath(page.id)} className="event-btn event-btn-outline">Meetup details</Link>
            ) : (
              !isNext && <a href={shown.link} target="_blank" rel="noopener noreferrer" className="event-btn event-btn-outline">See it on Meetup</a>
            )}
          </div>
        </article>
      ) : (
        <div className="card" style={{ padding: "40px var(--space-6)", textAlign: "center", borderRadius: "var(--radius-lg)" }}>
          <p className="text-muted">
            See all meetups of the group on <a href={group.meetupUrl} target="_blank" rel="noopener noreferrer" className="text-link">Meetup</a>.
          </p>
        </div>
      )}
    </div>
  );
}
