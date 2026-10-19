import { useParams, useSearchParams, Link } from "react-router-dom";
import { findMeetup, talksOf, type Meetup, type Talk } from "../data/meetups";
import { longDate, mapsUrl, timeRange } from "../lib/meetupFormat.js";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Markdown } from "../components/Markdown";
import { AgendaDetailsProvider, useAgendaDetails } from "../components/AgendaDetails";
import {
  About, AgendaList, BackLink, ClockIcon, DateBlock, GoodToKnow, HeaderImage, Hosts, Kicker, MediaSections,
  OrganizersLine, PinIcon, RsvpButton, RsvpLink, Section, TalkBlock, Timeline, WhenFact, WhereFact,
} from "../components/MeetupSections";

/**
 * /meetups/<id>/: one meetup. Three designs to compare with real data,
 * chosen with ?design=a|b|c (default a, which is also what the prerendered
 * HTML shows). Once one is chosen, the other two go.
 *   a  Classic: header image and key facts, talks, agenda, about, good to know
 *   b  Programme first: a large date, the evening as a timeline, host strip, description folded
 *   c  Speakers first: banner with the title, large speaker cards, practical block, compact agenda
 * A (and the default) has the live header when the meetup has an agenda (HeaderImage).
 * All three end with the quiet line for organizers.
 */
export function MeetupPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const m = findMeetup(id);
  useDocumentTitle(m ? `${m.title} | AWS Community Austria` : "Meetup not found | AWS Community Austria");

  if (!m) {
    return (
      <section className="section section-center">
        <div className="container">
          <h1 className="page-title">Meetup not found</h1>
          <p className="section-desc">There is no meetup at this address.</p>
          <Link to="/meetups/" className="btn btn-primary btn-lg">All meetups</Link>
        </div>
      </section>
    );
  }

  const asked = params.get("design");
  const design = asked === "b" || asked === "c" ? asked : "a";
  return (
    <AgendaDetailsProvider key={m.id} m={m}>
      <div className={`meetup-page meetup-design-${design}`} data-design={design}>
        {design === "b" ? <DesignB m={m} /> : design === "c" ? <DesignC m={m} /> : <DesignA m={m} />}
        <OrganizersLine m={m} />
      </div>
    </AgendaDetailsProvider>
  );
}

const hasAgenda = (m: Meetup) => (m.evening?.agenda.length ?? 0) > 0;

/** A: Classic. */
function DesignA({ m }: { m: Meetup }) {
  const talks = talksOf(m);
  return (
    <>
      <section className="meetup-hero">
        <div className="container">
          <BackLink />
          <div className={`meetup-hero-grid${m.stream ? " meetup-hero-grid-live" : m.image ? "" : " meetup-hero-grid-single"}`}>
            <div>
              <Kicker m={m} />
              <h1 className="meetup-title">{m.title}</h1>
              <div className="meetup-facts">
                <WhenFact m={m} />
                <WhereFact m={m} />
              </div>
              <Hosts m={m} />
              <RsvpLink m={m} />
            </div>
            <HeaderImage m={m} className="meetup-hero-image" />
          </div>
        </div>
      </section>

      {talks.length > 0 && (
        <Section title="Talks">
          <div className="talk-grid">
            {talks.map((t) => <TalkBlock key={t.title} t={t} />)}
          </div>
        </Section>
      )}

      {hasAgenda(m) && (
        <Section title="Agenda">
          <AgendaList m={m} />
        </Section>
      )}

      {m.description.trim() && (
        <Section title="About this meetup" surface>
          <About m={m} />
        </Section>
      )}

      <GoodToKnow m={m} />
      <MediaSections m={m} />
    </>
  );
}

/** B: Programme first. */
function DesignB({ m }: { m: Meetup }) {
  const talks = talksOf(m);
  return (
    <>
      <section className="meetup-hero">
        <div className="container">
          <BackLink />
          <div className="programme-head">
            <DateBlock iso={m.start} />
            <div>
              <Kicker m={m} />
              <h1 className="meetup-title">{m.title}</h1>
              <div className="meetup-facts">
                <div className="meetup-fact">
                  <ClockIcon />
                  <span>{timeRange(m.start, m.end)} (Vienna time)</span>
                </div>
                <WhereFact m={m} />
              </div>
              <RsvpLink m={m} />
            </div>
          </div>
        </div>
      </section>

      {hasAgenda(m) ? (
        <Section title="The evening">
          <Timeline m={m} />
        </Section>
      ) : (
        talks.length > 0 && (
          <Section title="Talks">
            <div className="talk-grid">
              {talks.map((t) => <TalkBlock key={t.title} t={t} />)}
            </div>
          </Section>
        )
      )}

      {m.hosts.length > 0 && (
        <section className="host-strip">
          <div className="container">
            <Hosts m={m} height={48} />
          </div>
        </section>
      )}

      {m.description.trim() && (
        <section className="meetup-section">
          <div className="container">
            <About m={m} collapsible />
          </div>
        </section>
      )}

      <GoodToKnow m={m} />
      <MediaSections m={m} />
    </>
  );
}

/** One large card per talk: the speakers big, then the talk title and abstract. */
function SpeakerCard({ t }: { t: Talk }) {
  const details = useAgendaDetails();
  return (
    <article className="speaker-card">
      <div className="speaker-card-people">
        {t.speakers.map((s) => {
          const person = (
            <>
              {s.photo && <img src={s.photo} alt="" className="speaker-card-photo" />}
              <div className="speaker-card-name">{s.name}</div>
              {s.role && <div className="speaker-card-role">{s.role}</div>}
              {s.company && <div className="speaker-card-company">{s.company}</div>}
            </>
          );
          return details ? (
            <button key={s.name} type="button" className="speaker-card-person speaker-card-button" onClick={() => details.openSpeaker(s.name)} aria-label={`About ${s.name}`}>
              {person}
            </button>
          ) : (
            <div key={s.name} className="speaker-card-person">{person}</div>
          );
        })}
      </div>
      <div className="speaker-card-talk">
        {t.start && <span className="label">{timeRange(t.start, t.end)}</span>}
        <h3>
          {details && t.id ? (
            <button type="button" className="agenda-open" onClick={() => details.openItem(t.id!)}>{t.title}</button>
          ) : (
            t.title
          )}
        </h3>
        {t.abstract && <Markdown source={t.abstract} className="prose talk-abstract" />}
      </div>
    </article>
  );
}

/** C: Speakers first. */
function DesignC({ m }: { m: Meetup }) {
  const talks = talksOf(m).filter((t) => t.speakers.length > 0);
  return (
    <>
      <section className={`meetup-banner${m.image ? "" : " meetup-banner-plain"}`}>
        {m.image && <img src={m.image} alt="" className="meetup-banner-image" referrerPolicy="no-referrer" />}
        <div className="meetup-banner-shade" />
        <div className="container meetup-banner-text">
          <BackLink />
          <Kicker m={m} />
          <h1 className="meetup-title">{m.title}</h1>
          <div className="meetup-banner-date">{longDate(m.start)}</div>
        </div>
      </section>

      {talks.length > 0 && (
        <Section title="Speakers">
          <div className="speaker-cards">
            {talks.map((t) => <SpeakerCard key={t.title} t={t} />)}
          </div>
        </Section>
      )}

      <Section title="Practical" surface>
        <div className="practical">
          <div className="practical-item">
            <span className="label">When</span>
            <div className="meetup-fact">
              <ClockIcon />
              <span>
                {longDate(m.start)}
                <br />
                <span className="text-muted">{timeRange(m.start, m.end)} (Vienna time)</span>
              </span>
            </div>
          </div>
          {m.venue && (
            <div className="practical-item">
              <span className="label">Where</span>
              <div className="meetup-fact">
                <PinIcon />
                <span>
                  {m.venue.name}
                  {m.venue.address && <><br /><span className="text-muted">{m.venue.address}</span></>}
                </span>
              </div>
            </div>
          )}
          {m.venue && (
            <div className="practical-item">
              <span className="label">How to get there</span>
              <a href={mapsUrl(m.venue)} target="_blank" rel="noopener noreferrer" className="text-link">Directions in Google Maps</a>
            </div>
          )}
          {m.hosts.length > 0 && (
            <div className="practical-item">
              <span className="label">Host</span>
              <Hosts m={m} height={36} label={null} />
            </div>
          )}
          <div className="practical-item practical-rsvp">
            <RsvpButton m={m} className="btn btn-primary btn-lg" />
          </div>
        </div>
      </Section>

      {hasAgenda(m) && (
        <Section title="Agenda">
          <AgendaList m={m} compact />
        </Section>
      )}

      {m.description.trim() && (
        <section className="meetup-section">
          <div className="container">
            <About m={m} collapsible />
          </div>
        </section>
      )}

      <GoodToKnow m={m} />
      <MediaSections m={m} />
    </>
  );
}
