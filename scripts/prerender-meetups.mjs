/**
 * After `vite build`: one static HTML file per page, so search engines and
 * link previews see each page's title, description and text without running
 * JavaScript, and so GitHub Pages serves these routes on a reload instead of
 * a 404.
 *
 *   dist/meetups/index.html          all meetups
 *   dist/meetups/<id>/index.html     one meetup: title, meta description, canonical URL,
 *                                    Open Graph and Twitter tags (image = Meetup header),
 *                                    JSON-LD schema.org Event, and the page's text in #root
 *   dist/<page>/index.html           the other routes (sponsors, team, prep guide, groups)
 *   dist/organizers/index.html       the organizers' page: noindex, not in the sitemap
 *   dist/index.html                  the home page, with canonical and Open Graph tags
 *   dist/sitemap.xml, dist/robots.txt
 *
 * Every file is a copy of dist/index.html, so the app starts the same way on
 * every page; React's createRoot replaces the prerendered text in #root.
 * Data: src/data/meetups.generated.json (npm run meetups:sync). The site's
 * address comes from public/CNAME.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { escapeHtml as esc, parseMarkdown, toHtml } from "../src/lib/markdown.js";
import { groupMeetups, hostsLabel, isComing, longDate, meetupPath, shortDate, speakerLabel, time, timeRange } from "../src/lib/meetupFormat.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE_NAME = "AWS Community Austria";

function fail(message) {
  console.error(`prerender failed: ${message}`);
  process.exit(1);
}

const templateFile = join(DIST, "index.html");
if (!existsSync(templateFile)) fail(`${templateFile} not found: run vite build first`);
const template = readFileSync(templateFile, "utf8");
const cnameFile = join(DIST, "CNAME");
const host = existsSync(cnameFile) ? readFileSync(cnameFile, "utf8").trim() : "awscommunity.at";
const ORIGIN = `https://${host}`;
const { meetups } = JSON.parse(readFileSync(join(ROOT, "src", "data", "meetups.generated.json"), "utf8"));

/** The other routes of the app (src/App.tsx). Group names as in src/data/groups.ts. */
const PAGES = [
  { path: "/group/aws-ug-vienna/", title: "AWS User Group Vienna", description: "Meetups with technical talks about AWS services, architecture patterns and cloud best practices in Vienna. Open to everyone interested in AWS." },
  { path: "/group/aws-wug-vienna/", title: "AWS Women's User Group Vienna", description: "A welcoming space for women and allies to learn, share and connect around AWS cloud technologies in Vienna." },
  { path: "/group/aws-ug-linz/", title: "AWS User Group Linz", description: "The AWS User Group in Linz: meetups, talks and networking for AWS practitioners in Upper Austria." },
  { path: "/sponsors/", title: "Sponsor a meetup", description: "Host an AWS community meetup in Austria: provide a venue, food and drinks, and meet 50 to 100 AWS professionals." },
  { path: "/team/", title: "Team", description: "The volunteers who organize the AWS User Groups in Austria." },
  { path: "/prep-guide/", title: "Speaker prep guide", description: "How to prepare a talk for an AWS User Group meetup in Austria." },
];

const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

/** As talksOf() in src/data/meetups.ts: from the agenda when there is one, else from meetup.json. */
const talksOf = (m) => {
  const fromAgenda = (m.evening?.agenda ?? []).filter((a) => a.talk).map((a) => ({ ...a.talk, start: a.start, end: a.end }));
  return fromAgenda.length ? fromAgenda : m.talks;
};

function render({ path, title, description, image, ld, body, type = "website", noindex = false }) {
  const url = `${ORIGIN}${path}`;
  const desc = description.length > 300 ? `${description.slice(0, 297).replace(/\s+\S*$/, "")}...` : description;
  const head = [
    ...(noindex ? [`<meta name="robots" content="noindex" />`] : []),
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    ...(image ? [`<meta property="og:image" content="${esc(image)}" />`] : []),
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    ...(image ? [`<meta name="twitter:image" content="${esc(image)}" />`] : []),
    ...(ld ? [jsonLd(ld)] : []),
  ].join("\n  ");

  let html = template;
  const swap = (re, to, what) => {
    if (!re.test(html)) fail(`dist/index.html has no ${what}`);
    html = html.replace(re, () => to);
  };
  swap(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, "<title>");
  swap(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(desc)}" />`, `<meta name="description">`);
  swap(/<\/head>/, `  ${head}\n</head>`, "</head>");
  swap(/<div id="root"><\/div>/, `<div id="root">${body}</div>`, `<div id="root"></div>`);
  return html;
}

function write(path, html) {
  const dir = join(DIST, ...path.split("/").filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

const siteNav = `<nav aria-label="Site"><a href="/">${SITE_NAME}</a> &middot; <a href="/meetups/">Meetups</a> &middot; <a href="/group/aws-ug-vienna/">UG Vienna</a> &middot; <a href="/group/aws-wug-vienna/">WUG Vienna</a> &middot; <a href="/group/aws-ug-linz/">UG Linz</a> &middot; <a href="/sponsors/">Sponsors</a> &middot; <a href="/team/">Team</a></nav>`;
const shell = (inner) => `<main class="prerender"><div class="container">${siteNav}${inner}</div></main>`;
const meetupTitle = (m) => `${m.title} | ${SITE_NAME}`;

// One meetup
function meetupPage(m) {
  const path = meetupPath(m.id);
  const coming = isComing(m);
  const talksList = talksOf(m);
  const speakers = [...new Map(talksList.flatMap((t) => t.speakers).map((s) => [s.name, s])).values()];
  const summary = m.summary.trim() || [m.title, shortDate(m.start), m.venue?.name].filter(Boolean).join(", ");
  const description = `${shortDate(m.start)}${m.venue ? `, ${m.venue.name}` : ""}. ${summary}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: m.title,
    description: summary,
    startDate: m.start,
    ...(m.end ? { endDate: m.end } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(m.venue
      ? {
          location: {
            "@type": "Place",
            name: m.venue.name,
            ...(m.venue.address ? { address: { "@type": "PostalAddress", streetAddress: m.venue.address, addressCountry: "AT" } } : {}),
          },
        }
      : {}),
    organizer: { "@type": "Organization", name: m.group.name, url: m.group.url },
    ...(m.hosts.length ? { sponsor: m.hosts.map((h) => ({ "@type": "Organization", name: h.name })) } : {}),
    ...(m.image ? { image: [m.image] } : {}),
    url: `${ORIGIN}${path}`,
    sameAs: m.meetupUrl,
    ...(speakers.length
      ? { performer: speakers.map((s) => ({ "@type": "Person", name: s.name, ...(s.links?.length ? { sameAs: s.links.map((l) => l.url) } : {}) })) }
      : {}),
  };
  const talks = talksList.length
    ? `<h2>Talks</h2>${talksList
        .map(
          (t) =>
            `<h3>${esc(t.title)}</h3>` +
            (t.speakers.length ? `<p>${t.speakers.map((s) => esc(speakerLabel(s))).join("; ")}</p>` : "") +
            (t.abstract ? toHtml(parseMarkdown(t.abstract)) : "") +
            t.speakers
              .filter((s) => s.bio)
              .map((s) => `<h4>About ${esc(s.name)}</h4>${toHtml(parseMarkdown(s.bio))}`)
              .join("")
        )
        .join("")}`
    : "";
  const agenda = m.evening?.agenda.length
    ? `<h2>Agenda</h2><ul>${m.evening.agenda
        .map((a) => `<li>${esc(time(a.start))} ${esc(a.talk?.title ?? a.title)}${a.kind === "closing" ? ` until ${esc(time(a.end))}` : ""}</li>`)
        .join("")}</ul>`
    : "";
  const media = [
    ["Slides", m.media?.slides ?? []],
    ["Recordings", m.media?.recordings ?? []],
  ]
    .filter(([, list]) => list.length)
    .map(([heading, list]) => `<h2>${heading}</h2><ul>${list.map((x) => `<li><a href="${esc(x.url)}">${esc(x.title)}</a></li>`).join("")}</ul>`)
    .join("");
  const body = shell(
    `<article>` +
      `<p><a href="/meetups/">All meetups</a></p>` +
      `<h1>${esc(m.title)}</h1>` +
      `<p>${esc(longDate(m.start))}, ${esc(timeRange(m.start, m.end))} (Vienna time)</p>` +
      (m.venue ? `<p>${esc(m.venue.name)}${m.venue.address ? `, ${esc(m.venue.address)}` : ""}</p>` : "") +
      (m.hosts.length ? `<p>${esc(hostsLabel(m.hosts))}</p>` : "") +
      `<p><a href="${esc(m.meetupUrl)}">${coming ? "RSVP on Meetup" : "View on Meetup"}</a></p>` +
      talks +
      agenda +
      media +
      (m.description.trim() ? `<h2>About this meetup</h2><div class="prose">${toHtml(parseMarkdown(m.description))}</div>` : "") +
      `</article>`
  );
  return render({ path, title: meetupTitle(m), description, image: m.image, ld, body, type: "article" });
}

// All meetups
function meetupsIndex() {
  const { coming, years } = groupMeetups(meetups);
  const item = (m) =>
    `<li><a href="${meetupPath(m.id)}">${esc(m.title)}</a>, ${esc(shortDate(m.start))}${m.venue ? `, ${esc(m.venue.name)}` : ""}${m.hosts.length ? `. ${esc(hostsLabel(m.hosts))}` : ""}</li>`;
  const body = shell(
    `<h1>All meetups</h1><p>Every meetup of the AWS User Group Vienna: the talks, the speakers and the companies that hosted us.</p>` +
      (coming.length ? `<h2>Coming up</h2><ul>${coming.map(item).join("")}</ul>` : "") +
      years.map((y) => `<h2>${y.year}</h2><ul>${y.meetups.map(item).join("")}</ul>`).join("")
  );
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AWS User Group Vienna meetups",
    itemListElement: meetups.map((m, i) => ({ "@type": "ListItem", position: i + 1, url: `${ORIGIN}${meetupPath(m.id)}`, name: m.title })),
  };
  return render({
    path: "/meetups/",
    title: `Meetups | ${SITE_NAME}`,
    description: "Every AWS User Group Vienna meetup: dates, venues, hosts, talks and speakers.",
    image: meetups.find((m) => m.image)?.image,
    ld,
    body,
  });
}

const urls = ["/"];

for (const p of PAGES) {
  write(p.path, render({ path: p.path, title: `${p.title} | ${SITE_NAME}`, description: p.description, body: shell(`<h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>`) }));
  urls.push(p.path);
}
write("/meetups/", meetupsIndex());
write(
  "/organizers/",
  render({
    path: "/organizers/",
    title: `For organizers | ${SITE_NAME}`,
    description: "The room screen for every meetup, with rehearsal links and how to use it.",
    noindex: true,
    body: shell(`<h1>For organizers</h1><p>The room screen for every meetup, with rehearsal links and how to use it.</p>`),
  })
);
urls.push("/meetups/");
for (const m of meetups) {
  write(meetupPath(m.id), meetupPage(m));
  urls.push(meetupPath(m.id));
}

// The home page last: the others are copies of the untouched template.
const homeDescription = template.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? SITE_NAME;
writeFileSync(
  templateFile,
  render({
    path: "/",
    title: SITE_NAME,
    description: homeDescription.replace(/&amp;/g, "&"),
    ld: { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: `${ORIGIN}/`, logo: `${ORIGIN}/assets/logos/awscommunityaustria.png` },
    body: shell(`<h1>${SITE_NAME}</h1><p>${esc(homeDescription.replace(/&amp;/g, "&"))}</p>`),
  })
);

writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(`${ORIGIN}${u}`)}</loc></url>`)
    .join("\n")}\n</urlset>\n`
);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /present/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`prerender: ${meetups.length} meetup pages, /meetups/, ${PAGES.length} other pages and the home page; sitemap.xml (${urls.length} URLs) and robots.txt, for ${ORIGIN}`);
