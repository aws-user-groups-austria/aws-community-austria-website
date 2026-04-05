import { Link } from "react-router-dom";
import { SponsorsCarousel } from "../components/SponsorsCarousel";
import { SPONSORS } from "../data/sponsors";
import { ORGANIZERS } from "../data/groups";

const STEPS = [
  {
    number: "01",
    title: "Reach out",
    description: "Send us an email at linda.mohamed@icloud.com expressing your interest in sponsoring. Tell us a bit about your company and what you're looking for.",
  },
  {
    number: "02",
    title: "We discuss the details",
    description: "We'll get back to you to discuss the format - venue hosting, catering, or a talk slot. We'll match your sponsorship to an upcoming meetup that fits your goals.",
  },
  {
    number: "03",
    title: "We announce you",
    description: "Your company gets announced to the community via Meetup, LinkedIn, and Slack before the event. Your logo appears on all event materials.",
  },
  {
    number: "04",
    title: "Host the event",
    description: "On the night, you introduce your company during the Sponsor Intro slot (6:10 - 6:20 PM). You get to meet 50-100 AWS professionals in person.",
  },
  {
    number: "05",
    title: "Stay connected",
    description: "After the event we share a recap post with photos and speaker slides. Your company stays visible in our sponsor wall on the website.",
  },
];

const PERKS = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "50-100 attendees per event",
    description: "Each meetup draws 50 to 100 AWS practitioners, engineers, and cloud architects.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
      </svg>
    ),
    title: "Visibility across 3 user groups",
    description: "Your sponsorship reaches the combined audiences of AWS UG Vienna, AWS Women's UG Vienna, and AWS UG Linz.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: "Intro slot at the event",
    description: "A dedicated 10-minute sponsor introduction slot at the start of the meetup to present your company, open roles, or product.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
      </svg>
    ),
    title: "Recruiting access",
    description: "Direct access to a room full of AWS-certified professionals actively engaged in the cloud community.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Community announcements",
    description: "Pre-event announcement to 2000+ community members on Meetup, LinkedIn, and the AWS Community DACH Slack.",
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: "Support the community",
    description: "Sponsorship is what makes free, accessible meetups possible. Your contribution directly funds the community.",
  },
];

export function SponsorsPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-base section-center">
        <div className="container">
          <div className="accent-bar" />
          <h1 className="page-title">
            Sponsor AWS Community <span className="text-accent">Austria</span>
          </h1>
          <p className="section-desc">
            Connect your brand with 2000+ AWS professionals across Vienna, Linz, and Austria. Sponsorship means hosting a meetup - providing a venue, food, and drinks for the community.
          </p>
          <a href="mailto:linda.mohamed@icloud.com" className="btn btn-primary btn-xl">
            Get in touch
          </a>
        </div>
      </section>

      {/* What sponsorship means */}
      <section className="section bg-surface">
        <div className="container">
          <div className="accent-bar" />
          <h2 className="section-title" style={{ marginBottom: "var(--space-4)" }}>What does sponsoring mean?</h2>
          <p className="section-desc">
            Our meetups are free for attendees. Sponsors make that possible by hosting the event - providing the venue, food, and drinks. In return you get a room full of AWS engineers, a dedicated intro slot, and community-wide visibility.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)" }}>
            {PERKS.map((p) => (
              <div key={p.title} className="card-dark" style={{ padding: "28px var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {p.icon}
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--color-text)" }}>{p.title}</div>
                <div className="text-muted" style={{ fontSize: "var(--font-size-base)", lineHeight: 1.6 }}>{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Meetup format */}
      <section className="section">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "48px", alignItems: "start" }}>

          {/* About */}
          <div>
            <div className="accent-bar-sm" />
            <h2 className="section-title-left">About Our User Groups</h2>

            {/* AWS Community Austria card */}
            <div className="card-accent">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <img src={`${import.meta.env.BASE_URL}assets/logos/awscommunityaustria.png`} alt="AWS Community Austria" style={{ height: "36px" }} />
                <span style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--color-text)" }}>AWS Community Austria</span>
              </div>
              <p className="text-muted" style={{ fontSize: "var(--font-size-base)", lineHeight: 1.7, marginBottom: "var(--space-5)" }}>
                Join Austria's vibrant AWS community where cloud enthusiasts and professionals connect, learn, and grow together. Our meetups feature expert talks, hands-on workshops, and valuable networking opportunities.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "var(--space-5)" }}>
                {[
                  { icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>, label: "Monthly Meetups" },
                  { icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>, label: "Expert Speakers" },
                  { icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>, label: "50-100 Attendees" },
                  { icon: <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>, label: "Various Venues" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--font-size-sm)" }} className="text-secondary">
                    <svg width="16" height="16" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{f.icon}</svg>
                    {f.label}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                {[
                  { label: "Join Vienna", url: "https://www.meetup.com/amazon-web-services-aws-vienna/" },
                  { label: "Women's UG", url: "https://www.meetup.com/aws-womens-user-group-vienna/" },
                  { label: "Join Linz", url: "https://www.meetup.com/aws-user-group-linz/" },
                  { label: "Join Slack", url: "https://join.slack.com/t/awscommunitydach" },
                ].map(b => (
                  <a key={b.label} href={b.url} target="_blank" rel="noopener noreferrer" className="tag" style={{ textDecoration: "none", color: "var(--color-text-secondary)" }}>
                    {b.label}
                  </a>
                ))}
              </div>
            </div>

            {/* When card */}
            <div className="card-accent">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-3)" }}>
                <svg width="20" height="20" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--color-text)" }}>When Do We Meet?</span>
              </div>
              <p className="text-muted" style={{ fontSize: "var(--font-size-sm)", marginBottom: "var(--space-3)", lineHeight: 1.6 }}>Our meetups follow different schedules based on location:</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                {[
                  { group: "Vienna:", detail: "Monthly meetups (typically second Wednesday)" },
                  { group: "Women's UG Vienna:", detail: "Quarterly events" },
                  { group: "Linz:", detail: "Organized when we have a sponsor venue" },
                ].map(r => (
                  <li key={r.group} className="text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
                    <strong className="text-secondary">{r.group}</strong> {r.detail}
                  </li>
                ))}
              </ul>
              <p className="text-muted" style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--space-3)", fontStyle: "italic" }}>
                Have office space in Linz?{" "}
                <a href="mailto:linda.mohamed@icloud.com" className="text-link">Please reach out</a>
                {" "}if you'd like to host a meetup!
              </p>
            </div>

            {/* Where card */}
            <div className="card-accent" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-3)" }}>
                <svg width="20" height="20" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--color-text)" }}>Where Do We Meet?</span>
              </div>
              <p className="text-muted" style={{ fontSize: "var(--font-size-sm)", lineHeight: 1.6 }}>
                Our venues rotate thanks to diverse sponsors, including AWS Office Vienna, R-IT Office, and APA. Each meetup welcomes 50-100 attendees of all experience levels in an inclusive environment.
              </p>
            </div>
          </div>

          {/* Meetup format */}
          <div>
            <div className="accent-bar-sm" />
            <h2 className="section-title-left">Meetup Format</h2>
            <div className="card">
              {[
                { time: "5:00 - 6:00 PM",  title: "Networking",     desc: "Drinks, snacks, and conversations." },
                { time: "6:00 - 6:10 PM",  title: "Welcome",        desc: "Intro and agenda overview." },
                { time: "6:10 - 6:20 PM",  title: "Sponsor Intro",  desc: "Host introduction.", highlight: true },
                { time: "6:20 - 7:00 PM",  title: "First Talk",     desc: "AWS-related talk + Q&A." },
                { time: "7:00 - 7:20 PM",  title: "Break",          desc: "Networking & Refreshments." },
                { time: "7:20 - 8:00 PM",  title: "Second Talk",    desc: "AWS talk + Q&A." },
                { time: "8:00 PM+",        title: "Networking",     desc: "Discussions over drinks." },
              ].map((slot, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-4) var(--space-5)",
                  borderBottom: i < 6 ? "var(--border)" : "none",
                  background: slot.highlight ? "var(--color-accent-dim)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "var(--font-size-base)", fontWeight: 700, color: slot.highlight ? "var(--color-accent)" : "var(--color-text)" }}>{slot.title}</div>
                      <div className="text-muted" style={{ fontSize: "var(--font-size-sm)" }}>{slot.desc}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    background: slot.highlight ? "var(--color-accent)" : "var(--color-surface-2)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}>
                    {slot.time}
                  </span>
                </div>
              ))}
              <div style={{ padding: "var(--space-5)", textAlign: "center", borderTop: "var(--border)" }}>
                <a href="https://sessionize.com/aws-community-austria" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  Submit a Talk
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to become a sponsor */}
      <section className="section bg-surface">
        <div className="container">
          <div className="accent-bar" />
          <h2 className="section-title">How to become a sponsor</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {STEPS.map((step, i) => (
              <div key={step.number} style={{ display: "flex", gap: "var(--space-6)", paddingBottom: i < STEPS.length - 1 ? "40px" : "0", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", left: "27px", top: "56px", width: "2px", height: "calc(100% - 16px)", background: "var(--color-surface-2)" }} />
                )}
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "var(--color-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "var(--font-size-base)", fontWeight: 900, color: "var(--color-text)",
                  flexShrink: 0, zIndex: 1,
                }}>
                  {step.number}
                </div>
                <div style={{ paddingTop: "var(--space-3)" }}>
                  <div style={{ fontSize: "var(--font-size-md)", fontWeight: 700, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>{step.title}</div>
                  <div className="text-muted" style={{ fontSize: "var(--font-size-base)", lineHeight: 1.7 }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past sponsors carousel */}
      <SponsorsCarousel />

      {/* All sponsors grid */}
      <section className="section-sm bg-light">
        <div className="container">
          <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--color-text-dark)", textAlign: "center", marginBottom: "var(--space-8)" }}>
            All past sponsors
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "var(--space-4)" }}>
            {SPONSORS.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="card-on-light"
                style={{ minWidth: "160px", height: "100px", gap: "var(--space-2)" }}>
                <img src={`${import.meta.env.BASE_URL}assets/sponsors/${s.logo}`} alt={s.name} style={{ maxHeight: "48px", maxWidth: "120px", objectFit: "contain" }} />
                <span style={{ fontSize: "var(--font-size-xs)", color: "#555", fontWeight: 500 }}>{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-base section-center">
        <div className="container">
          <div className="accent-bar" />
          <h2 className="section-title-left" style={{ textAlign: "center" }}>Ready to sponsor?</h2>
          <p className="section-desc">
            Reach out to any of us - we are all happy to discuss sponsorship and find a meetup that fits.
          </p>

          {/* Team mini-row */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "var(--space-6)", marginBottom: "48px" }}>
            {ORGANIZERS.map(o => (
              <div key={o.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <img
                  src={`${import.meta.env.BASE_URL}${o.photo!.replace(/^\//, "")}`}
                  alt={o.name}
                  className="avatar avatar-sm"
                />
                <span className="text-secondary" style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{o.name.split(" ")[0]}</span>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  {o.email && (
                    <a href={`mailto:${o.email}`} className="icon-link">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </a>
                  )}
                  {o.linkedin && (
                    <a href={o.linkedin} target="_blank" rel="noopener noreferrer" className="icon-link">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Link to="/team" className="btn btn-primary btn-xl">
            Meet the full team
          </Link>
        </div>
      </section>
    </>
  );
}
