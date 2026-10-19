import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MEETUPS } from "../data/meetups";
import { meetupPath, presentPath, shortDate } from "../lib/meetupFormat.js";
import { useDocumentTitle } from "../lib/useDocumentTitle";

/** Keeps this page out of search results while it is shown (the prerendered HTML has the same tag). */
function useNoIndex() {
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
}

/** A meetup with a deck PDF to pick, its preview, and open and download. The coming one first, else the latest. */
function DeckPicker() {
  const withDeck = MEETUPS.filter((m) => m.deck);
  const now = Date.now();
  const coming = [...withDeck].reverse().find((m) => Date.parse(m.end ?? m.start) >= now);
  const [id, setId] = useState((coming ?? withDeck[0])?.id ?? "");
  const m = withDeck.find((x) => x.id === id);
  if (!withDeck.length) return <p className="text-muted">No deck yet: run make deck for a meetup (below).</p>;
  return (
    <div className="deck-picker">
      <label className="deck-picker-select">
        <span className="label">Meetup</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {withDeck.map((x) => (
            <option key={x.id} value={x.id}>
              {shortDate(x.start)} &middot; {x.title}
            </option>
          ))}
        </select>
      </label>
      {m?.deck && (
        <>
          <div className="deck-picker-actions">
            <a href={m.deck} target="_blank" rel="noopener" className="btn btn-primary btn-sm">Open the PDF to present</a>
            <a href={m.deck} download className="btn btn-outline btn-sm">Download</a>
            <Link to={meetupPath(m.id)} className="text-link">Meetup page &rarr;</Link>
          </div>
          <a href={m.deck} target="_blank" rel="noopener" className="deck-picker-preview" aria-label={`Open the slide deck of ${m.title}`}>
            {m.deckCover ? <img key={m.deckCover} src={m.deckCover} alt={`First slide of the deck: ${m.title}`} /> : <span>Open the PDF</span>}
          </a>
        </>
      )}
    </div>
  );
}

/**
 * /organizers/: the room screen for every meetup, with a rehearsal link and
 * how to use it. Linked only from the footer and from each meetup page's
 * "For organizers" line; not in the main nav, not in the sitemap, noindex.
 */
export function OrganizersPage() {
  useDocumentTitle("For organizers | AWS Community Austria");
  useNoIndex();

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">For <span className="text-accent">organizers</span></h1>
          <p className="text-secondary page-lead">
            The room screen runs the evening on the screen at the venue: the pre-show while doors are open, the welcome,
            the host's slot, each speaker's handover, the break, the closing and the last networking. It follows the clock on its own.
          </p>
        </div>
      </section>

      <section className="meetup-section">
        <div className="container">
          <h2 className="meetups-heading">How it works</h2>
          <ol className="howto">
            <li>On the room laptop, open <strong>Present</strong> for the meetup below and press <kbd>F</kbd> for fullscreen.</li>
            <li><kbd>&rarr;</kbd> <kbd>&larr;</kbd>, <kbd>PgDn</kbd> <kbd>PgUp</kbd> or a clicker step forward and back; click the bar at the bottom to jump to a part of the evening.</li>
            <li><kbd>A</kbd> goes back to the clock, <kbd>B</kbd> turns the screen black, <kbd>?</kbd> shows the help.</li>
            <li><strong>Rehearse from 17:55 at 10x</strong> starts the clock at 17:55 on the meetup's date and runs it ten times faster; a badge at the top of the screen says so the whole time. Present always runs on the real clock.</li>
            <li>The room laptop needs the Amazon Ember font installed; the screens are set in it.</li>
          </ol>
        </div>
      </section>

      <section className="meetup-section" id="deck">
        <div className="container">
          <h2 className="meetups-heading">The slide deck</h2>
          <p className="text-secondary page-lead">
            The deck for the evening is our Google Slides template, filled in with the meetup&apos;s agenda, host, speakers
            and talks. Pick a meetup to present its PDF, or to look back at an earlier one; each meetup&apos;s page links its
            deck too.
          </p>
          <DeckPicker />
          <h3 className="deck-howto-title">Make the deck for a meetup</h3>
          <ol className="howto">
            <li>Save the template from the shared Google Slides (File, Download, Microsoft PowerPoint) as <code>meetup-event-vienna/deck/aws-ug-vienna-austria.pptx</code> in the meetup stream workspace. It stays out of git.</li>
            <li>In the workspace, run <code>make deck EVENT=&lt;meetup id&gt;</code>; the id is the end of the meetup page&apos;s address, for example <code>2026-10-20-aws-meetup-vienna-53</code>.</li>
            <li>That writes the <code>.pptx</code> and the PDF to present from (PowerPoint exports it), in <code>meetup-event-vienna/events/&lt;meetup id&gt;/deck/</code>. <code>make open-deck EVENT=&lt;meetup id&gt;</code> opens the PDF.</li>
          </ol>
        </div>
      </section>

      <section className="meetup-section bg-surface">
        <div className="container">
          <h2 className="meetups-heading">Every meetup</h2>
          <ul className="organizer-list">
            {MEETUPS.map((m) => (
              <li key={m.id}>
                <div>
                  <span className="label">{shortDate(m.start)}</span>
                  <Link to={meetupPath(m.id)} className="organizer-list-title">{m.title}</Link>
                </div>
                {m.stream ? (
                  <div className="organizer-list-actions">
                    <a href={presentPath(m.id)} className="btn btn-primary btn-sm">Present</a>
                    <a href={presentPath(m.id, "17:55", 10)} className="btn btn-outline btn-sm">Rehearse from 17:55 at 10x</a>
                  </div>
                ) : (
                  <span className="text-muted organizer-list-none">No agenda for the room screen</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
