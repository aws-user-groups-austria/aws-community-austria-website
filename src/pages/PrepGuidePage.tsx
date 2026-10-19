import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MEETUPS } from "../data/meetups";
import { SPONSORS, logoSrc } from "../data/sponsors";
import { meetupPath } from "../lib/meetupFormat.js";
import { useDocumentTitle } from "../lib/useDocumentTitle";

/**
 * /prep-guide/: how a meetup comes together, for hosts, sponsors and speakers.
 * The content follows the group's prep guide in Canva ("AWS Meetup Vienna Prep
 * Guide", V4 2025/07; its PDF is on Google Drive); the pictures are its pages,
 * the examples in it, and screenshots of a real meetup on this site. Images in
 * public/assets/prep-guide/ (sources in its README).
 */

const PDF_URL = "https://drive.google.com/file/d/1vT2p8i-1nj5cjHWILy1OYx4dWNCIeOo9/view";
const SESSIONIZE_URL = "https://sessionize.com/aws-community-austria";
const LINKEDIN_URL = "https://www.linkedin.com/company/aws-user-group-vienna";
const MEETUP_URL = "https://www.meetup.com/amazon-web-services-aws-vienna/";
const CONTACT = "hello@awscommunity.at";
const PAST_PROMOTIONS = [
  "https://www.linkedin.com/feed/update/urn:li:activity:6976139115750678528/",
  "https://www.linkedin.com/posts/ebcont-it_next-aws-user-group-meetup-22nd-june-5-activity-6943478179462344704-JNQy",
];

const img = (file: string) => `${import.meta.env.BASE_URL}assets/prep-guide/${file}`;
const badge = (file: string) => `${import.meta.env.BASE_URL}present/badges/${file}`;

/** The meetup the page shows as its example: the coming one with a room screen, else the latest. */
const EXAMPLE = MEETUPS.find((m) => m.stream && m.deck) ?? MEETUPS[0];

const External = ({ href, children, className = "text-link" }: { href: string; children: ReactNode; className?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
    {children}
  </a>
);

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** A titled section with the site's accent bar. */
function Block({ id, kicker, title, lead, children, surface = false }: { id?: string; kicker?: string; title: string; lead?: ReactNode; children: ReactNode; surface?: boolean }) {
  return (
    <section id={id} className={`pg-section${surface ? " bg-surface" : ""}`}>
      <div className="container">
        {kicker && <span className="label">{kicker}</span>}
        <h2 className="pg-title">{title}</h2>
        {lead && <p className="pg-lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

/** One step of the timeline: when, what, the host's checklist, the tools, and an example picture. */
function Step({
  when,
  title,
  roles,
  children,
  host = [],
  tools = [],
  picture,
}: {
  when: string;
  title: string;
  roles: string[];
  children: ReactNode;
  host?: ReactNode[];
  tools?: ReactNode[];
  picture?: { src: string; alt: string; caption: ReactNode; wide?: boolean };
}) {
  return (
    <li className="pg-step">
      <div className="pg-step-marker" aria-hidden="true" />
      <div className="pg-step-body">
        <span className="pg-step-when">{when}</span>
        <h3>{title}</h3>
        <div className="pg-step-roles">
          {roles.map((r) => (
            <span key={r} className={`pg-role pg-role-${r.toLowerCase()}`}>{r}</span>
          ))}
        </div>
        <div className="pg-step-text">{children}</div>
        {host.length > 0 && (
          <ul className="pg-checklist" aria-label="For the host">
            {host.map((h, i) => (
              <li key={i}>
                <Check />
                <span><strong>Host:</strong> {h}</span>
              </li>
            ))}
          </ul>
        )}
        {tools.length > 0 && (
          <ul className="pg-tools" aria-label="Where it happens">
            {tools.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )}
      </div>
      {picture && (
        <figure className={`pg-step-picture${picture.wide ? " pg-step-picture-wide" : ""}`}>
          <img src={picture.src} alt={picture.alt} loading="lazy" />
          <figcaption>{picture.caption}</figcaption>
        </figure>
      )}
    </li>
  );
}

export function PrepGuidePage() {
  useDocumentTitle("Meetup prep guide | AWS Community Austria");
  const example = EXAMPLE;

  return (
    <div className="prep-guide">
      {/* ── Hero: what this is, the PDF, and its pages stacked ── */}
      <section className="pg-hero">
        <div className="container pg-hero-grid">
          <div>
            <span className="label">For hosts, sponsors and speakers</span>
            <h1 className="pg-hero-title">
              Host an AWS User Group <span className="text-accent">meetup</span>
            </h1>
            <p className="pg-hero-lead">
              Who needs to do what and when: everything for an evening with 40 to 100 AWS builders, two talks, food and a
              lot of networking. If you don&apos;t have a venue, we find one with you; if you don&apos;t know any speakers,
              we help.
            </p>
            <div className="pg-hero-actions">
              <External href={PDF_URL} className="btn btn-primary btn-lg">Download the PDF guide</External>
              <External href={SESSIONIZE_URL} className="btn btn-outline btn-lg">Submit a talk</External>
            </div>
            <p className="pg-hero-contact">
              Questions? <a href={`mailto:${CONTACT}`} className="text-link">{CONTACT}</a> &middot;{" "}
              <External href={LINKEDIN_URL}>LinkedIn</External> &middot; <External href={MEETUP_URL}>Meetup</External>
            </p>
          </div>
          <a href={PDF_URL} target="_blank" rel="noopener noreferrer" className="pg-stack" aria-label="Open the prep guide PDF">
            <img src={img("guide-page-3.jpg")} alt="" className="pg-stack-page pg-stack-3" />
            <img src={img("guide-page-2.jpg")} alt="" className="pg-stack-page pg-stack-2" />
            <img src={img("guide-page-1.jpg")} alt="First page of the AWS User Group meetup preparation guide: the timeline" className="pg-stack-page pg-stack-1" />
            <span className="pg-stack-tag">PDF &middot; 4 pages</span>
          </a>
        </div>
      </section>

      {/* ── At a glance ── */}
      <section className="pg-glance">
        <div className="container">
          <ul className="pg-facts">
            <li><span className="pg-fact-value">Tue to Thu</span><span className="pg-fact-label">usually at the end of the month</span></li>
            <li><span className="pg-fact-value">17:00 / 18:00</span><span className="pg-fact-label">doors open / welcome</span></li>
            <li><span className="pg-fact-value">40 to 100</span><span className="pg-fact-label">people, by the venue</span></li>
            <li><span className="pg-fact-value">2 talks</span><span className="pg-fact-label">25 to 35 minutes, then Q&amp;A</span></li>
            <li><span className="pg-fact-value">English</span><span className="pg-fact-label">the meetup language</span></li>
            <li><span className="pg-fact-value">Free</span><span className="pg-fact-label">registration on Meetup.com</span></li>
          </ul>
        </div>
      </section>

      {/* ── Who does what ── */}
      <Block kicker="The roles" title="Who does what" lead="Three roles make a meetup. You will see the same badges at the evening itself.">
        <div className="pg-roles">
          <article className="pg-role-card">
            <img src={badge("host.png")} alt="" />
            <h3>The host</h3>
            <p className="pg-role-sub">Your company: location and food</p>
            <ul>
              <li>Fixes the date and the venue with us, and names a contact person</li>
              <li>Provides the room, catering and drinks</li>
              <li>Proposes a talk or picks a speaker</li>
              <li>Promotes the meetup to its own audience</li>
              <li>Introduces itself in the sponsor slot (about 10 minutes)</li>
            </ul>
          </article>
          <article className="pg-role-card">
            <img src={badge("leader.png")} alt="" />
            <h3>The user group leaders</h3>
            <p className="pg-role-sub">Us: event, visuals, promotion</p>
            <ul>
              <li>Schedule the meetup on Meetup.com and manage the registration</li>
              <li>Design the event visuals with your logo</li>
              <li>Coordinate the speakers and talks via Sessionize</li>
              <li>Promote the meetup on our LinkedIn page</li>
              <li>Welcome everyone and run the evening</li>
            </ul>
          </article>
          <article className="pg-role-card">
            <img src={badge("speaker.png")} alt="" />
            <h3>The speakers</h3>
            <p className="pg-role-sub">Two technical talks</p>
            <ul>
              <li>Submit the talk on Sessionize (technical, no marketing)</li>
              <li>Prepare the talk and, ideally, a demo</li>
              <li>Speak 25 to 35 minutes and answer questions</li>
              <li>Send their slides afterwards, so we can add them to the meetup page</li>
            </ul>
          </article>
        </div>
      </Block>

      {/* ── The timeline ── */}
      <Block id="timeline" kicker="The timeline" title="From two months before to the evening" surface lead="What happens when, who does it, and what it looks like. Each step shows a real example.">
        <ol className="pg-steps">
          <Step
            when="2 months before"
            title="Fix the date & a venue"
            roles={["Host", "Leaders"]}
            host={[<>provide a <strong>contact person</strong></>, <>send us a few photos of the room, so we can plan the seats together</>]}
            tools={[<>We track every meetup in our Notion meetup planner</>]}
            picture={{ src: img("example-notion.png"), alt: "A meetup in the Notion planner: date, topics, status, hosts, user group", caption: "Every meetup starts as a card in our planner." }}
          >
            <p>
              Our meetups are held on Tuesdays to Thursdays. Doors open at 17:00, the welcome is at 18:00, at your office or
              an external venue for 40 to 100 people.
            </p>
          </Step>
          <Step
            when="1 month before"
            title="Find a topic & speakers"
            roles={["Host", "Leaders", "Speaker"]}
            host={[<>propose your own talk, or select a speaker</>]}
            tools={[<>Talks are submitted on <External href={SESSIONIZE_URL}>Sessionize</External>: technical, no marketing</>]}
            picture={{ src: img("example-sessionize.png"), alt: "Talks submitted on Sessionize with their speakers", caption: <>Talks on <External href={SESSIONIZE_URL}>Sessionize</External>, ready to pick.</> }}
          >
            <p>
              We have two short talks (25 to 35 minutes), each followed by Q&amp;A. The topics should be related or complement
              each other. Hosts may propose a speaker and we arrange the second one; if none is proposed, we arrange both.
            </p>
          </Step>
          <Step
            when="4 weeks before"
            title="Schedule on Meetup.com"
            roles={["Leaders", "Host"]}
            host={[
              <>join our <External href={MEETUP_URL}>Meetup group</External></>,
              <>send us your <strong>company logo</strong></>,
              <>check the draft: talk, names, roles, date and location</>,
            ]}
            tools={[<>We draft the event on Meetup.com and add you as a co-host, so you can review it and see who is coming</>]}
            picture={{ src: img("example-meetup-visual.jpg"), alt: `The Meetup visual for ${example?.title ?? "a meetup"}`, caption: <>The visual we design for the event, with your logo{example ? <> &middot; <External href={example.meetupUrl}>see it on Meetup</External></> : null}.</>, wide: true }}
          >
            <p>
              Once drafted, we add you as a host to the Meetup event for review. Please confirm the talk, names, roles, date
              and location before we publish the event and the visual.
            </p>
          </Step>
          <Step
            when="2 weeks before"
            title="Social media promotion"
            roles={["Leaders", "Host", "Speaker"]}
            host={[<>send us your <strong>company LinkedIn page</strong> for tagging</>, <>like and share our posts, and post to your own audience</>]}
            tools={[
              <><External href={LINKEDIN_URL}>AWS User Group Vienna on LinkedIn</External>: please like and share</>,
              <>Past promotions: <External href={PAST_PROMOTIONS[0]!}>example 1</External>, <External href={PAST_PROMOTIONS[1]!}>example 2</External></>,
            ]}
            picture={{ src: img("example-linkedin.png"), alt: "LinkedIn posts promoting a meetup", caption: "How the promotion looks on LinkedIn. You also get a promotional video for your own channels." }}
          >
            <p>
              We start with 40 seats and expand to 60 to 100 a week before the event, by the venue&apos;s capacity. To account
              for a no-show rate of about 30 %, we adjust the seats and agree the limit with you. Promotion begins one to two
              weeks before, to fill the room.
            </p>
          </Step>
          <Step
            when="The evening"
            title="See you at the meetup!"
            roles={["Host", "Leaders", "Speaker"]}
            tools={[
              example ? <>A real example: <Link to={meetupPath(example.id)} className="text-link">the page of {example.title}</Link>, with the agenda, the talks and the slide deck</> : <>Every meetup gets its own page on this site</>,
              example?.deck ? <>The <External href={example.deck}>slide deck</External> we present, in our design</> : <>The slide deck we present, in our design</>,
            ]}
            picture={{ src: img("example-room-screen.jpg"), alt: "The room screen at a meetup, handing over to the speakers", caption: "Our room screen runs the evening: the agenda, the countdown, each speaker's handover.", wide: true }}
          >
            <div className="pg-agenda" role="table" aria-label="The agenda">
              {[
                ["17:00 - 18:00", "Entry & networking"],
                ["18:00 - 18:10", "Welcome & introduction (AWS Community Vienna)"],
                ["18:10 - 18:20", "Sponsor introduction: your slot"],
                ["18:20 - 19:00", "Talk 1"],
                ["19:00 - 19:20", "Break"],
                ["19:20 - 20:00", "Talk 2"],
                ["20:00 - open end", "Networking"],
              ].map(([t, what]) => (
                <div key={t} role="row" className={/Talk|Sponsor|Welcome/.test(what!) ? "pg-agenda-main" : undefined}>
                  <span role="cell">{t}</span>
                  <span role="cell">{what}</span>
                </div>
              ))}
            </div>
            <p>We run the welcome and the community introduction; the sponsor introduction is your opportunity to present your company.</p>
          </Step>
          <Step
            when="After the meetup"
            title="Photos, slides and feedback"
            roles={["Leaders"]}
            picture={{ src: img("example-meetup-page.jpg"), alt: "A meetup page on awscommunity.at", caption: <>Every meetup keeps its page{example ? <>: <Link to={meetupPath(example.id)} className="text-link">open the example</Link></> : null}.</>, wide: true }}
          >
            <p>
              We share the photos, add the slides to the meetup&apos;s page on this site, and attendees rate the evening on
              Meetup. Talks are recorded only on request, as raw files without editing.
            </p>
          </Step>
        </ol>
      </Block>

      {/* ── What you handle / what we handle ── */}
      <Block kicker="Responsibilities" title="What you handle, what we handle">
        <div className="pg-split">
          <article className="pg-card">
            <span className="pg-card-tag">You, the host</span>
            <h3>Venue &amp; catering</h3>
            <ul className="pg-list">
              <li>A space for 40 to 60+ participants (please send photos for confirmation)</li>
              <li>
                Catering and drinks, preferably:
                <ul>
                  <li>cold finger food: a 30 % mix of vegan, vegetarian and fish or meat</li>
                  <li>fresh fruit</li>
                  <li>alcoholic and soft drinks, coffee and tea if possible</li>
                </ul>
              </li>
            </ul>
            <h3>Marketing &amp; hosting</h3>
            <ul className="pg-list">
              <li>Promote the event to your audience</li>
              <li>Be there at the meetup as the host</li>
            </ul>
          </article>
          <article className="pg-card">
            <span className="pg-card-tag pg-card-tag-us">Us, the user group</span>
            <h3>Event &amp; registration</h3>
            <ul className="pg-list">
              <li>Schedule the meetup and manage the registration</li>
              <li>Make you a co-host on Meetup, for edits and the participant list</li>
              <li>Create the event visuals with your logo</li>
              <li>Promote the event on our <External href={LINKEDIN_URL}>LinkedIn page</External></li>
              <li>Welcome everyone and introduce AWS Community Vienna</li>
              <li>Coordinate the speakers and talks via <External href={SESSIONIZE_URL}>Sessionize</External></li>
              <li>Optional: record the talks (raw files only, no editing)</li>
            </ul>
            <h3>Speakers &amp; content</h3>
            <ul className="pg-list">
              <li>Two speakers for technical sessions of about 30 minutes</li>
              <li>Your speaker? Submit the session on <External href={SESSIONIZE_URL}>Sessionize</External></li>
              <li>Optional: AWS credits to give away, usually with a quiz</li>
            </ul>
          </article>
        </div>
      </Block>

      {/* ── What we need from you ── */}
      <Block kicker="Checklist" title="What we need from you" surface lead="Send it to us as early as you can; past meetups show how it is used.">
        <div className="pg-needs">
          <ul className="pg-checklist pg-checklist-big">
            <li><Check /><span>A <strong>contact person</strong> for the evening</span></li>
            <li><Check /><span>Your <strong>company logo</strong> (SVG or a large PNG)</span></li>
            <li><Check /><span>Your <strong>company LinkedIn page</strong>, so we can tag you</span></li>
            <li><Check /><span>A few <strong>photos of the room</strong>, and how many people fit</span></li>
            <li><Check /><span>The <strong>date and location</strong>, with the address and how to get in</span></li>
          </ul>
          <div className="pg-card pg-speaker-card">
            <h3>For each talk</h3>
            <ul className="pg-list">
              <li>Talk title, 25 to 50 characters</li>
              <li>Talk summary, 500 to 1000 characters</li>
              <li>Speaker photo</li>
              <li>Speaker background, 100 to 200 characters</li>
            </ul>
            <External href={SESSIONIZE_URL} className="btn btn-primary btn-sm">Submit on Sessionize</External>
          </div>
        </div>
      </Block>

      {/* ── Impressions ── */}
      <Block kicker="Impressions" title="What a meetup looks like" lead="Thanks a lot to our hosts, sponsors and speakers for making these evenings possible!">
        <div className="pg-photos">
          <img src={img("photo-crowd.jpg")} alt="A full room at an AWS User Group Vienna meetup" loading="lazy" className="pg-photo-wide" />
          <img src={img("photo-group-hosts.jpg")} alt="Hosts and organizers at a meetup" loading="lazy" />
          <img src={img("photo-talk.jpg")} alt="A talk at a meetup" loading="lazy" />
        </div>
      </Block>

      {/* ── Past hosts ── */}
      <Block kicker="Thank you" title="Past hosts & sponsors" surface>
        <div className="pg-logos">
          {SPONSORS.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className={`pg-logo${s.dark ? " pg-logo-dark" : ""}`} title={s.name}>
              <img src={logoSrc(s)} alt={s.name} loading="lazy" />
            </a>
          ))}
        </div>
      </Block>

      {/* ── Links ── */}
      <Block kicker="Everything in one place" title="Useful links">
        <div className="pg-links">
          <External href={PDF_URL} className="pg-link"><strong>The prep guide (PDF)</strong><span>All of this on four pages, to share</span></External>
          <External href={SESSIONIZE_URL} className="pg-link"><strong>Sessionize</strong><span>Submit a talk</span></External>
          <External href={MEETUP_URL} className="pg-link"><strong>Meetup.com</strong><span>Join the group, RSVP</span></External>
          <External href={LINKEDIN_URL} className="pg-link"><strong>LinkedIn</strong><span>Follow, like and share</span></External>
          {example && (
            <Link to={meetupPath(example.id)} className="pg-link"><strong>Example meetup page</strong><span>{example.title}</span></Link>
          )}
          <Link to="/meetups/" className="pg-link"><strong>All meetups</strong><span>Past and coming</span></Link>
          <Link to="/sponsors/" className="pg-link"><strong>Sponsor a meetup</strong><span>Options for companies</span></Link>
          <Link to="/team/" className="pg-link"><strong>The team</strong><span>Who to talk to</span></Link>
        </div>
      </Block>

      {/* ── Contact ── */}
      <section className="pg-cta">
        <div className="container">
          <h2>Happy building &amp; see you at the meetup!</h2>
          <p>Want to host the next one, or have a question? We are happy to help.</p>
          <div className="pg-hero-actions pg-cta-actions">
            <a href={`mailto:${CONTACT}`} className="btn btn-primary btn-lg">Contact us</a>
            <External href={PDF_URL} className="btn btn-outline btn-lg">Download the PDF guide</External>
          </div>
          <p className="pg-cta-team">AWS User Group Leaders Austria: Linda, Philipp, Dima, Jakob, Roman and Matthias</p>
        </div>
      </section>
    </div>
  );
}
