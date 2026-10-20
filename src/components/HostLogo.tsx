import { findCompany, logoSrc } from "../data/sponsors";

/**
 * A host's logo on a white plate, from the one host-to-logo map in
 * src/data/sponsors.ts. A host the map does not know is shown by name, never
 * with another company's logo.
 */
export function HostLogo({ name, height = 32, link = false }: { name: string; height?: number; link?: boolean }) {
  const company = findCompany(name);
  if (!company) {
    return <span className="host-name" title={name}>{name}</span>;
  }
  const plate = (
    <span className={company.dark ? "host-logo host-logo--dark" : "host-logo"} title={company.name} style={{ height: height + 12 }}>
      <img src={logoSrc(company)} alt={company.name} style={{ maxHeight: height }} />
    </span>
  );
  return link ? (
    <a href={company.url} target="_blank" rel="noopener noreferrer" className="host-logo-link">{plate}</a>
  ) : (
    plate
  );
}

/** "Hosted by" (or another label, or none) with each host's logo or name; nothing when there are no hosts. */
export function HostLine({ hosts, height = 24, link = false, label = "Hosted by" }: { hosts?: string[]; height?: number; link?: boolean; label?: string | null }) {
  if (!hosts?.length) return null;
  return (
    <div className="host-line">
      {label && <span className="host-line-label">{label}</span>}
      {hosts.map((h) => (
        <HostLogo key={h} name={h} height={height} link={link} />
      ))}
    </div>
  );
}
