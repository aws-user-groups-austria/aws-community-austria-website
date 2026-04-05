import { ORGANIZERS } from "../data/groups";

export function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-surface border-bottom-subtle section-center">
        <div className="container">
          <div className="accent-bar" />
          <h1 className="page-title">
            Meet the <span className="text-accent">Team</span>
          </h1>
          <p className="section-desc" style={{ marginBottom: 0 }}>
            Six volunteers running three user groups across Austria. All of us are happy to answer questions - reach out any time.
          </p>
        </div>
      </section>

      {/* Organizer cards */}
      <section className="section">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {ORGANIZERS.map((o) => (
            <div key={o.name} className="team-card">

              {/* Photo column */}
              <div className="team-photo-col">
                <img
                  src={`${import.meta.env.BASE_URL}${o.photo!.replace(/^\//, "")}`}
                  alt={o.name}
                  className="avatar avatar-lg"
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  {o.email && (
                    <a href={`mailto:${o.email}`} title={o.email} className="icon-link">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </a>
                  )}
                  {o.linkedin && (
                    <a href={o.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="icon-link">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--space-3)", marginBottom: "var(--space-1)" }}>
                  <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{o.name}</h2>
                  <span className="badge-role">{o.role}</span>
                </div>
                <p className="text-accent" style={{ fontSize: "var(--font-size-base)", fontWeight: 500, marginBottom: "var(--space-4)" }}>{o.focus}</p>
                <p className="text-muted" style={{ fontSize: "var(--font-size-base)", lineHeight: 1.8, marginBottom: "var(--space-5)" }}>{o.bio}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {o.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-surface border-top-subtle section-center">
        <div className="container" style={{ maxWidth: "600px" }}>
          <div className="accent-bar" />
          <h2 className="section-title-left" style={{ textAlign: "center" }}>Any questions?</h2>
          <p className="text-secondary" style={{ fontSize: "var(--font-size-md)", lineHeight: 1.7, marginBottom: "var(--space-8)" }}>
            All of us are happy to help. Drop us a message on LinkedIn or reach out via email - we'll get back to you.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <a href="mailto:linda.mohamed@icloud.com" className="btn btn-primary btn-lg">
              Send us an email
            </a>
            <a href="https://join.slack.com/t/awscommunitydach" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
              Join our Slack
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
