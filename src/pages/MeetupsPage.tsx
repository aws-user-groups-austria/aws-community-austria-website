import { Link } from "react-router-dom";
import { MEETUPS, type Meetup } from "../data/meetups";
import { groupMeetups, meetupPath, shortDate, time } from "../lib/meetupFormat.js";
import { HostLine } from "../components/HostLogo";
import { useDocumentTitle } from "../lib/useDocumentTitle";

/** /meetups/: every meetup, the coming ones first, then the past ones by year. */
export function MeetupsPage() {
  useDocumentTitle("Meetups | AWS Community Austria");
  const { coming, years } = groupMeetups(MEETUPS);

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">All <span className="text-accent">meetups</span></h1>
          <p className="text-secondary page-lead">
            Every meetup of the AWS User Group Vienna: the talks, the speakers and the companies that hosted us.
          </p>
        </div>
      </section>

      {coming.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <h2 className="meetups-heading">Coming up</h2>
            <MeetupGrid meetups={coming} />
          </div>
        </section>
      )}

      {years.map((y) => (
        <section key={y.year} className="section-sm meetups-year">
          <div className="container">
            <h2 className="meetups-heading">{y.year}</h2>
            <MeetupGrid meetups={y.meetups} />
          </div>
        </section>
      ))}

      {MEETUPS.length === 0 && (
        <section className="section section-center">
          <div className="container">
            <a href="https://www.meetup.com/amazon-web-services-aws-vienna/events/?type=past" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              See our meetups on Meetup
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function MeetupGrid({ meetups }: { meetups: Meetup[] }) {
  return (
    <div className="meetup-grid">
      {meetups.map((m) => (
        <MeetupCard key={m.id} meetup={m} />
      ))}
    </div>
  );
}

function MeetupCard({ meetup: m }: { meetup: Meetup }) {
  return (
    <Link to={meetupPath(m.id)} className="meetup-card">
      <MeetupImage meetup={m} className="meetup-card-image" />
      <div className="meetup-card-body">
        <span className="label">
          {shortDate(m.start)}, {time(m.start)}
        </span>
        <h3 className="meetup-card-title">{m.title}</h3>
        {m.venue && <div className="meetup-card-venue text-secondary">{m.venue.name}</div>}
        <HostLine hosts={m.hosts.map((h) => h.name)} height={30} />
      </div>
    </Link>
  );
}

/** The Meetup header image, or a plain panel with the group name when there is none. */
export function MeetupImage({ meetup: m, className, eager = false }: { meetup: Meetup; className: string; eager?: boolean }) {
  if (!m.image) {
    return (
      <div className={`${className} meetup-image-empty`} aria-hidden="true">
        <span>{m.group.name}</span>
      </div>
    );
  }
  return <img src={m.image} alt="" className={className} loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" />;
}
