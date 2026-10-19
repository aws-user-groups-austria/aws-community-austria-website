# src/lib

Helpers without React state.

| File | What |
|------|------|
| `markdown.js`, `markdown.d.ts` | Reads a Meetup description (markdown) into a tree that `src/components/Markdown.tsx` renders as React elements; `toHtml()` escapes it for the prerendered pages |
| `meetupFormat.js`, `meetupFormat.d.ts` | Dates in Europe/Vienna, page and room-screen paths, maps links, host and speaker labels, coming and past grouping |
| `useDocumentTitle.ts` | Sets the tab title while a page is shown |
| `meetupUrl.ts` | One normalized form of a Meetup event link, to match event cards to meetup pages |

`markdown.js` and `meetupFormat.js` are plain JavaScript with type
declarations next to them, because `scripts/prerender-meetups.mjs` runs them
in Node during the build, without a compile step.
