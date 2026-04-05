import { SPONSORS } from "../data/sponsors";

export function SponsorsCarousel() {
  return (
    <section className="sponsor-section">
      <div className="accent-bar" />
      <h2 className="subsection-title" style={{ color: "var(--color-text-dark)" }}>
        Our Sponsors
      </h2>

      <div style={{ overflow: "hidden" }}>
        <div className="sponsor-track">
          {[...SPONSORS, ...SPONSORS].map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-card"
            >
              <div className="sponsor-logo-wrap">
                <img
                  src={`${import.meta.env.BASE_URL}assets/sponsors/${s.logo}`}
                  alt={s.name}
                  style={{ maxHeight: "72px", maxWidth: "160px", objectFit: "contain" }}
                />
              </div>
              <span className="sponsor-name">{s.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
