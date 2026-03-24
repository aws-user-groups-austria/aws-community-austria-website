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

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
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
