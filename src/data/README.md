# src/data

The site's content as TypeScript and JSON.

| File | What |
|------|------|
| `groups.ts` | User groups, cloud clubs, organizers |
| `events.ts` | Upcoming meetup cards and community days (speakers: organizers by name, or guests with a photo) |
| `sponsors.ts` | Every company with a logo, the one host-name-to-logo map (with aliases), and the sponsor wall |
| `meetups.ts` | Types and lookups for every meetup's page, including the evening (agenda, talks, photos) from `event.json` |
| `meetups.generated.json` | Written by `npm run meetups:sync` from the workspace's `meetup.json` files; do not edit |
