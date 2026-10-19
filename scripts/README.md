# scripts

Node scripts run through `npm run`, no dependencies beyond Node itself.

| Script | Run with | What |
|--------|----------|------|
| `fetch-meetups.mjs` | the scheduled GitHub Action | Upcoming events from the groups' Meetup RSS feeds into `public/data/meetups.json` |
| `present-sync.mjs` | `npm run present:sync` | The room-screen player (meetup web player build), every `event.json` and `people/` from the meetup stream workspace into `public/present/`, then `meetups-sync.mjs` |
| `meetups-sync.mjs` | `npm run meetups:sync` | Every `meetup.json` (and the agenda, abstracts and speaker photos from `event.json`) from the workspace into `src/data/meetups.generated.json` |
| `prerender-meetups.mjs` | the last step of `npm run build` | Per-page HTML with title, meta, Open Graph, JSON-LD and text for every route, plus `sitemap.xml` and `robots.txt` |
| `check-site.mjs` | `npm run check:site` | The built site in headless Chrome: checks and screenshots |

Refresh everything from the workspace (the workspace is `..`, or set
`MEETUP_STREAM_DIR`):

```bash
npm run present:sync
```

The website's README has the details.
