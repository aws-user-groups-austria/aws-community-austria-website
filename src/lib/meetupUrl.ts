/** One form per Meetup event link: https, no www, no query or hash, trailing slash. */
export function normalizeMeetupUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return `https://${u.host.toLowerCase().replace(/^www\./, "")}${path.toLowerCase()}`;
  } catch {
    return null;
  }
}
