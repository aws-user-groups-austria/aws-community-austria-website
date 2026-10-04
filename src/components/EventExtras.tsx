import { Link } from "react-router-dom";
import type { Speaker } from "../data/events";

const row = { display: "flex", alignItems: "flex-start", gap: "7px", fontSize: "var(--font-size-sm)", textAlign: "left", lineHeight: 1.4 } as const;
const icon = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, marginTop: "3px" } } as const;

/** Speaker line for event and community-day cards. */
export function SpeakerLine({ label, speakers }: { label: string; speakers?: Speaker[] }) {
  if (!speakers?.length) return null;
  return (
    <div style={row} className="text-secondary">
      <svg {...icon}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
      <span>
        {label}{" "}
        {speakers.map((s, i) => (
          <span key={s.name}>
            {i > 0 && (i === speakers.length - 1 ? " & " : ", ")}
            {s.url
              ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-link">{s.name}</a>
              : s.name}
          </span>
        ))}
      </span>
    </div>
  );
}

/** "Looking for a sponsor" line linking to the sponsors page. */
export function SponsorWanted({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <div style={row} className="text-secondary">
      <svg {...icon}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      <span>
        Looking for a sponsor - <Link to="/sponsors" className="text-link">become one</Link>
      </span>
    </div>
  );
}
