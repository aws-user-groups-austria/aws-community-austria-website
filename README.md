# AWS Community Austria - Website

Landing page for [aws-community.at](https://aws-community.at) - the home of all AWS User Groups in Austria.

**Site:** https://awscommunity.at (also https://aws-community.at)

---

## Use This as a Template

This repo is designed to be forked by other AWS User Groups as a ready-to-deploy community website.

### Fork & Deploy in 5 Steps

1. **Fork** this repo on GitHub
2. **Rename** the fork to match your community (e.g. `aws-community-germany-website`)
3. **Enable GitHub Pages** in repo Settings → Pages → Source: **GitHub Actions**
4. **Update** `vite.config.ts` - change `base` to match your repo name:
   ```ts
   base: "/aws-community-germany-website/",
   ```
5. **Update** `src/App.tsx` - change the `BrowserRouter` basename:
   ```tsx
   <BrowserRouter basename="/aws-community-germany-website">
   ```

Push to `main` - the GitHub Actions workflow builds and deploys automatically.

### Customize Your Content

| File | What to change |
|------|---------------|
| `src/data/groups.ts` | Your user groups, descriptions, Sessionize API IDs |
| `src/pages/HomePage.tsx` | Hero text, stats, CTAs |
| `public/logos/` | Replace logos with your own |
| `src/components/Layout.tsx` | Nav links, footer |

---

## Local Development

Install the dependencies:

```bash
npm install
```

Start the dev server on http://localhost:5173:

```bash
npm run dev
```

Build for production into `dist/`. This runs the typecheck, the Vite build
and `scripts/prerender-meetups.mjs` (see "Meetup pages" below):

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Check the built site in headless Chrome (needs Google Chrome; see
"Checking the site" below):

```bash
npm run check:site
```

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **React Router** for client-side routing
- **Sessionize API** for pulling speaker/session data
- **GitHub Actions** for automated deploy to GitHub Pages

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home - hero, stats, user group cards, Sessionize CTA |
| `/group/:groupId` | Individual group page - agenda, sessions, host CTA |
| `/prep-guide` | Speaker prep guide |
| `/sponsors` | Sponsoring a meetup |
| `/team` | Organizers |
| `/meetups/` | Every meetup: coming first, then past ones by year |
| `/meetups/<id>/` | One meetup: date, venue, host logo, talks, agenda, description, room-screen preview (`?design=a|b|c`) |
| `/organizers/` | For organizers: the room screen for every meetup, rehearsal links, how to use it (footer link only, not in the nav or the sitemap, noindex) |
| `/present/?event=<id>` | The room screen for a meetup evening (static files in `public/present/`, not a React route) |

## Meetup pages

Every meetup, past and coming, has its own page at `/meetups/<id>/`, listed
at `/meetups/` and linked from the main nav, the home page's "All meetups"
button and the "Meetup details" link on each event card.

- The data is `src/data/meetups.generated.json`, written by
  `npm run meetups:sync` from every
  `meetup-event-vienna/events/<id>/meetup.json` in the workspace (the
  contract is "meetup.json (version 1)" in the workspace `SPEC.md`), newest
  first. When the folder also has an `event.json`, the meetup gets its
  evening from it: the agenda with times, each talk's abstract, the speakers
  with role, company and photo (resolved to the copies under
  `/present/events/<id>/assets/` and `/present/people/`), the photo notice
  and the code of conduct. The file is committed, so the build needs no
  sibling folder. A file that breaks the contract is skipped with the
  reason; nothing is invented, and a section without data is not shown.
- The description is Meetup's markdown, rendered by a small reader in
  `src/lib/markdown.js` (paragraphs, headings, lists, bold, italic, code,
  links). It builds React elements, never HTML strings, and keeps only
  http(s) and mailto links.
- Host logos come from one map, `src/data/sponsors.ts`, used by every page:
  a host name or alias (for example "RBI" or "Raiffeisen Bank International
  AG") gives that company's logo; a host the map does not know is shown by
  name. Logo sources are in `public/assets/sponsors/README.md`.
- Photos, Slides and Recordings appear only when the meetup's `media` has
  entries.

### Three designs to compare

The page has three designs, chosen with `?design=` (the prerendered HTML is
design a). Once one is chosen, the other two go.

| Design | Open | What |
|--------|------|------|
| a, Classic | `/meetups/<id>/` | Header image and key facts (date, time, venue with a maps link, host logo, RSVP), talks with speaker photos and abstracts, agenda, the Meetup description, good to know |
| b, Programme first | `/meetups/<id>/?design=b` | A large date, the evening as a timeline with each talk expanded, a host strip, the Meetup description folded |
| c, Speakers first | `/meetups/<id>/?design=c` | A banner with the title, large speaker cards, a practical block (when, where, how to get there, host, RSVP), a compact agenda, the description folded |

All three end with a "Preview of the room screen" and a quiet line for
organizers.

### The room screen

On the evening of a meetup, the screen at the venue runs the meetup web
player from `/present/`. It follows the agenda by the clock: the pre-show
while doors are open, the welcome, the host's slot, each speaker's handover,
the break countdown, the closing and the last networking.

- It is not linked from the start page or the group pages. Organizers find
  it at the very bottom of each meetup page ("For organizers: Present this
  meetup on the room screen", "rehearse from 17:55") and on `/organizers/`,
  linked in small print in the footer.
- Each meetup page that has an agenda shows the real player in a 16:9 frame,
  not clickable and loaded only when scrolled to, at the moment the first
  talk begins (30 seconds into it, while the screen hands over to the
  speakers).
- `public/present/` holds the built web player, `events/<id>.json`,
  `events/index.json` and `people/`. Vite copies it to `dist/present/`
  unchanged, and GitHub Pages serves it as plain files, so the React router
  never sees `/present/`. `robots.txt` keeps it out of search results.
- The player and the event files come from the meetup stream workspace
  (`aws-community-meetup-stream-all`): the web player build in
  `meetup-stream-templates/web-player/dist/`, each
  `meetup-event-vienna/events/<id>/event.json` with its `assets/`, and
  `meetup-event-vienna/people/`.

Build the web player first, in the `meetup-stream-templates` folder of the
meetup stream workspace:

```bash
make player-build
```

Then refresh everything from this repo: the player, the event files and
`people/` into `public/present/`, and then the meetup pages' data (it runs
`meetups:sync` after it):

```bash
npm run present:sync
```

This repo sits inside the meetup stream workspace, so the workspace is
expected at `..`. Use another location with `MEETUP_STREAM_DIR`:

```bash
MEETUP_STREAM_DIR=/path/to/aws-community-meetup-stream-all npm run present:sync
```

The script stops with a message, and leaves `public/present/` untouched,
when the web player build or the event files are missing. Commit
`public/present/` and `src/data/meetups.generated.json` after a sync so
GitHub Pages serves them.

Refresh the meetup pages' data only, without the player:

```bash
npm run meetups:sync
```

Rehearse the evening locally after a build:

```bash
npm run preview
```

Then open `http://localhost:4173/present/?event=2026-10-20-aws-meetup-vienna-53&at=17:55&speed=10`
(`at` starts the clock at that local time on the event date, `speed` runs it
faster).

### Search engines

`npm run build` ends with `scripts/prerender-meetups.mjs`. It writes
`dist/meetups/index.html`, `dist/meetups/<id>/index.html` and one
`index.html` for each other route, all copies of `dist/index.html` with the
page's own title, meta description, canonical URL
(`https://awscommunity.at/...`, from `public/CNAME`), Open Graph and
Twitter tags (image: the Meetup header), JSON-LD (a schema.org `Event` per
meetup), and the page's text (facts, talks with abstracts, agenda,
description) inside `#root` as plain HTML for crawlers without JavaScript;
React replaces it when the app starts. `/organizers/` gets `noindex`. It
also writes `dist/sitemap.xml` (without `/organizers/`) and
`dist/robots.txt` (which keeps `/present/` out of search results). Because
each route is a real folder, GitHub Pages serves a reload of
`/meetups/<id>/` without a 404. `npm run preview` redirects `/meetups/<id>`
to `/meetups/<id>/` as GitHub Pages does.

## Checking the site

`npm run check:site` serves `dist/` with `vite preview` and opens in
headless Chrome: `/` and a group page (no room-screen links there), `/meetups/`,
every meetup page (organizers line, preview, talks, agenda, host logos, no
empty sections), the three designs at 1440 and 390 px, `/organizers/`
(noindex, not in the sitemap), the room screen at `/present/` and the
prerendered HTML. It fails on console errors, HTTP errors, broken images and
any wording in the site's own text that calls the room screen a stream. Requests to other hosts (Meetup
images, Google Fonts) are answered locally with placeholders, so nothing
leaves the machine. Screenshots go to `../out/website/`; another folder with
`OUT_DIR`:

```bash
OUT_DIR=/tmp/site-check npm run check:site
```

## Sessionize Integration

Each user group has a `sessionizeApiId` in `src/data/groups.ts`. When configured, the group page automatically fetches and displays upcoming sessions from the Sessionize API.

## The daily Meetup update (GitHub Actions)

`.github/workflows/fetch-meetups.yml` runs every morning at 06:00 UTC (and on
demand from the Actions tab). It runs `scripts/fetch-meetups.mjs`, which reads
the RSS feed of each Austrian group for the event links, then each event page
for the real date, title and venue (the feed's `pubDate` is when an event was
announced, not when it happens), and keeps the events that have not started.
The home page shows them next to the hand-written ones in `src/data/events.ts`.

The bot commits `public/data/meetups.json` only when the events changed, and
then deploys the site itself (`deploy.yml` as a called workflow), because a
commit made with the workflow token never starts the push deploy. On a day
without news it does nothing. Run it locally:

```sh
node scripts/fetch-meetups.mjs
```

## Architecture

Part of the AWS Community Austria project:

| Repo | Purpose |
|------|---------|
| [`aws-community-austria-website`](https://github.com/aws-user-groups-austria/aws-community-austria-website) (this) | The awscommunity.at website (also served at aws-community.at) |
| [`aws-community-austria-meetup`](https://github.com/aws-user-groups-austria/aws-community-austria-meetup) | Per-meetup config + GitHub Actions |
| The meetup stream workspace (`meetup-sync`, `meetup-event-vienna`, `meetup-stream-templates`, `meetup-deck`; not published yet) | Meetup data, the room screen behind `/present/`, the slide deck |

## License

CC BY-NC-SA 4.0 - Free to use and adapt with attribution, non-commercial.

## Automatic updates, every Monday and Friday

| When (UTC) | Where | What |
|---|---|---|
| 05:30 | `meetup-event-vienna`, "Update meetups" | `make update`: the past meetups from the archive page, each coming meetup synced, a folder for a meetup announced since. Committed when something changed (a run that only fetched again leaves nothing to commit) |
| 06:30 | the website, "Update meetup pages" | The room screen built from `meetup-stream-templates`, then `npm run present:sync` and a build: the meetup pages, `/present/` and the live headers. Committed and deployed when something changed |
| daily 06:00 | the website, "Fetch Meetup Events" | The next and last meetup of each group, for the start page and the group pages |

Both scheduled jobs can be started by hand from the repository's Actions tab ("Run workflow").

Not automatic: the slide decks. The deck template holds the organizers'
contacts and stays out of git, and the PDF comes from PowerPoint, so before a
meetup an organizer runs `make deck EVENT=<id>` and then publishes the decks
with `npm run present:sync` in the website. The scheduled job leaves the
published decks as they are.

## Part of the meetup tools

One of the repositories behind the AWS User Groups Austria meetup evenings, in
[aws-user-groups-austria](https://github.com/aws-user-groups-austria). Start with
[`meetup-workspace`](https://github.com/aws-user-groups-austria/meetup-workspace): it clones all of them (`make
clone`), installs them and runs the whole evening (`make start`); the contract
between them is its `SPEC.md`.

| Repository | What |
|---|---|
| [`meetup-workspace`](https://github.com/aws-user-groups-austria/meetup-workspace) | The Makefile, the spec and the guide |
| [`meetup-sync`](https://github.com/aws-user-groups-austria/meetup-sync) | A Meetup page to `event.json` |
| [`meetup-event-vienna`](https://github.com/aws-user-groups-austria/meetup-event-vienna) | One folder per meetup, shared photos and logos |
| [`meetup-stream-templates`](https://github.com/aws-user-groups-austria/meetup-stream-templates) | The room screen: Remotion scenes and the web player |
| [`meetup-deck`](https://github.com/aws-user-groups-austria/meetup-deck) | The slide deck, filled in |
| **[`aws-community-austria-website`](https://github.com/aws-user-groups-austria/aws-community-austria-website)** | awscommunity.at |
