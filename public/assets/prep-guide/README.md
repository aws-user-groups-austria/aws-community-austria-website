# prep-guide

Pictures for `/prep-guide/` (`src/pages/PrepGuidePage.tsx`).

| File | Source |
|---|---|
| `guide-page-1.jpg` to `guide-page-4.jpg` | The pages of the prep guide PDF on Google Drive, "V4_202507 AWS Meetup Vienna Prep Guide.pdf" (the PDF the page links), rendered at 120 dpi |
| `example-notion.png`, `example-sessionize.png`, `example-meetup.png`, `example-linkedin.png` | Cut from the timeline page of the Canva design "V3 2025/02 AWS Meetup Vienna Prep Guide" (DAGfHeLJE5s, page 7) |
| `photo-crowd.jpg`, `photo-group-hosts.jpg`, `photo-talk.jpg` | The supporters page of the same design (page 4) |
| `example-meetup-visual.jpg` | The Meetup header of AWS Meetup Vienna #53 |
| `example-meetup-page.jpg` | A screenshot of `/meetups/2026-10-20-aws-meetup-vienna-53/` on this site |
| `example-room-screen.jpg` | The room screen's speaker handover for #53 (`meetup-stream-templates/out/stills`) |

When the guide changes in Canva: export the PDF to Google Drive, update `PDF_URL` in the page and
`Layout.tsx`, and render the pages again (`pdftoppm -jpeg -r 120 guide.pdf guide-page`).
