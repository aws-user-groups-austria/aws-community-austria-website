# AWS Community Austria — Website

Landing page for [aws-community.at](https://aws-community.at) — the home of all AWS User Groups in Austria.

## User Groups

- **AWS User Group Vienna** — Regular technical meetups
- **AWS Women's User Group Vienna** — Inclusive meetups for women and allies
- **AWS User Group Linz** — Upper Austria meetups

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **React Router** for client-side routing
- **Sessionize API** for pulling speaker/session data

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page — hero, stats, user group cards, Sessionize CTA |
| `/group/:groupId` | Individual group page — agenda, sessions, host CTA |

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

CC BY-NC-SA 4.0
