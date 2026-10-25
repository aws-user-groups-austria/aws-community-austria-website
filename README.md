# AWS Community Austria — Website

Landing page for [aws-community.at](https://aws-community.at) — the home of all AWS User Groups in Austria.

**Live site:** https://mzzavaa.github.io/aws-community-austria-website/

---

## Use This as a Template

This repo is designed to be forked by other AWS User Groups as a ready-to-deploy community website.

### Fork & Deploy in 5 Steps

1. **Fork** this repo on GitHub
2. **Rename** the fork to match your community (e.g. `aws-community-germany-website`)
3. **Enable GitHub Pages** in repo Settings → Pages → Source: **GitHub Actions**
4. **Update** `vite.config.ts` — change `base` to match your repo name:
   ```ts
   base: "/aws-community-germany-website/",
   ```
5. **Update** `src/App.tsx` — change the `BrowserRouter` basename:
   ```tsx
   <BrowserRouter basename="/aws-community-germany-website">
   ```

Push to `main` — the GitHub Actions workflow builds and deploys automatically.

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

Build for production into `dist/`:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **React Router** for client-side routing
- **Sessionize API** for pulling speaker/session data
- **GitHub Actions** for automated deploy to GitHub Pages

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — hero, stats, user group cards, Sessionize CTA |
| `/group/:groupId` | Individual group page — agenda, sessions, host CTA |
| `/prep-guide` | Speaker prep guide |
| `/sponsors` | Sponsoring a meetup |
| `/team` | Organizers |
| `/live/?event=<id>` | Live stream player for a meetup evening (static files in `public/live/`, not a React route) |

## Live stream

On the evening of a meetup, the room screen runs the meetup web player from
`/live/`. It follows the agenda by the clock: pre-show while doors are open,
welcome, sponsor and speaker handovers, the break countdown, closing and the
last networking.

- An event card gets an "Open the live stream" button (home page and group
  page), linking to `/live/?event=<id>`, when its Meetup link is listed in
  `public/live/events/index.json` (written by `npm run live:sync`), so a
  meetup from `public/data/meetups.json` gets it without a code change. An
  event in `src/data/events.ts` can also name it with `liveEventId`.
- `public/live/` holds the built web player, `events/<id>.json` and
  `events/index.json`. Vite copies
  it to `dist/live/` unchanged, and GitHub Pages serves it as plain files, so
  the React router never sees `/live/`.
- The player and the event files come from the meetup stream workspace
  (`aws-community-meetup-stream-all`): the web player build in
  `meetup-stream-templates/web-player/dist/` and each
  `meetup-event-vienna/events/<id>/event.json`.

Build the web player first, in the `meetup-stream-templates` folder of the
meetup stream workspace:

```bash
make player-build
```

Then copy it and the event files into `public/live/`, from this repo:

```bash
npm run live:sync
```

The workspace is expected next to this repo at
`../aws-community-meetup-stream-all`. Use another location with
`MEETUP_STREAM_DIR`:

```bash
MEETUP_STREAM_DIR=/path/to/aws-community-meetup-stream-all npm run live:sync
```

The script stops with a message, and leaves `public/live/` untouched, when the
web player build or the event files are missing. Commit `public/live/` after a
sync so GitHub Pages serves it.

Rehearse the evening locally after a build:

```bash
npm run preview
```

Then open `http://localhost:4173/live/?event=2026-10-20-aws-meetup-vienna-53&at=17:55`
(`at` starts the clock at that local time on the event date, `speed` runs it
faster).

## Sessionize Integration

Each user group has a `sessionizeApiId` in `src/data/groups.ts`. When configured, the group page automatically fetches and displays upcoming sessions from the Sessionize API.

## Architecture

Part of the AWS Community Austria project:

| Repo | Purpose |
|------|---------|
| `aws-community-austria-templates` | Slide generators, prep guide templates |
| `aws-community-austria-website` (this) | aws-community.at landing page |
| `aws-community-austria-meetup` | Per-meetup config + GitHub Actions |

## License

CC BY-NC-SA 4.0 — Free to use and adapt with attribution, non-commercial.
