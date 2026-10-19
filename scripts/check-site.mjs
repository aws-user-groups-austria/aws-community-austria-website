/**
 * Checks the built site in headless Chrome, served by `vite preview`, and
 * writes a screenshot per check.
 *
 *   npm run check:site                       (after npm run build)
 *
 * Opens /, /meetups/, every meetup page, the three meetup page designs
 * (?design=a|b|c, desktop and 390 px), the agenda details dialogs (every
 * agenda line and speaker, desktop and 390 px), /organizers/ and the room screen at
 * /present/; follows the organizers' "Present" link; checks the room-screen
 * preview, the host logos (RBI's own logo for #53, never Raiffeisen
 * Informatik's), that no page says "live stream", and that a reload of
 * /meetups/<id>/ gets the prerendered HTML. Fails on console errors, uncaught
 * exceptions, HTTP errors and broken local images.
 *
 * Nothing leaves this machine: every request that is not to the local
 * server (Meetup header images, Google Fonts) is answered with a local
 * placeholder, so header images show as grey panels in the screenshots.
 *
 * Screenshots go to OUT_DIR (default ../out/website, the meetup stream
 * workspace's out/ folder). Set CHROME=/path/to/chrome if Chrome is not in
 * the usual place.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.resolve(ROOT, process.env.OUT_DIR || "../out/website");
const PORT = 4192;
const CDP_PORT = 9431;
const BASE = `http://localhost:${PORT}`;
const EVENT = "2026-10-20-aws-meetup-vienna-53";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!fs.existsSync(path.join(ROOT, "dist", "meetups", "index.html"))) {
  console.error("No dist/meetups/index.html: run npm run build first.");
  process.exit(1);
}
const chrome = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean).find((c) => fs.existsSync(c));
if (!chrome) {
  console.error("No Chrome found. Set CHROME=/path/to/chrome.");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".png")) fs.rmSync(path.join(OUT, f));
const { meetups } = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "meetups.generated.json"), "utf8"));

const children = [];
const temp = [];
process.on("exit", () => {
  for (const c of children) {
    try {
      if (c.detached) process.kill(-c.pid, "SIGTERM");
      else c.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
  for (const d of temp) {
    try {
      fs.rmSync(d, { recursive: true, force: true, maxRetries: 5 });
    } catch {
      /* Chrome may still be writing; the OS cleans tmp */
    }
  }
});
process.on("SIGINT", () => process.exit(130));

const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { cwd: ROOT, stdio: "ignore", detached: true });
preview.detached = true;
children.push(preview);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "site-check-chrome-"));
temp.push(profile);
children.push(
  spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--mute-audio", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" })
);

const waitFor = async (url, seconds) => {
  for (let i = 0; i < seconds * 4; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`timed out waiting for ${url}`);
};
await waitFor(`${BASE}/`, 60);
await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`, 30);

const target = (await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()).find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
let problems = [];
let warnings = [];
const external = new Set();

const PLACEHOLDER_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#3a3f55"/><text x="800" y="460" fill="#9CA3AF" font-family="sans-serif" font-size="40" text-anchor="middle">external image, not loaded in the check</text></svg>`
).toString("base64");

ws.onmessage = async (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? m.error);
    pending.delete(m.id);
    return;
  }
  if (m.method === "Fetch.requestPaused") {
    const { requestId, request, resourceType } = m.params;
    if (request.url.startsWith(BASE)) {
      send("Fetch.continueRequest", { requestId });
      return;
    }
    external.add(new URL(request.url).host);
    const image = resourceType === "Image";
    send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: "Content-Type", value: image ? "image/svg+xml" : resourceType === "Stylesheet" ? "text/css" : "text/plain" }],
      body: image ? PLACEHOLDER_SVG : "",
    });
    return;
  }
  if (m.method === "Network.responseReceived" && m.params.response.status >= 400) problems.push(`HTTP ${m.params.response.status} ${m.params.response.url}`);
  if (m.method === "Runtime.exceptionThrown") problems.push(`exception: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`);
  if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning"))
    (m.params.type === "error" ? problems : warnings).push(`console.${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").split("\n")[0]}`);
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") problems.push(`log: ${m.params.entry.text} ${m.params.entry.url ?? ""}`);
};
function send(method, params = {}) {
  return new Promise((res) => {
    const i = ++seq;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "evaluate failed");
  return r.result.value;
};

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Log.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });

const viewport = (width, height, mobile = false) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });

async function open(url, settle = 1200) {
  await send("Page.navigate", { url: url.startsWith("http") ? url : `${BASE}${url}` });
  for (let i = 0; i < 60; i++) {
    await sleep(200);
    if ((await evaluate("document.readyState")) === "complete") break;
  }
  await sleep(settle);
}
async function shot(name, fullPage = true) {
  let clip;
  if (fullPage) {
    // Scroll through once so lazy images load, then back to the top.
    await evaluate(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400)); })()`);
    const { cssContentSize } = await send("Page.getLayoutMetrics");
    clip = { x: 0, y: 0, width: cssContentSize.width, height: Math.min(cssContentSize.height, 12000), scale: 1 };
  }
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) });
  const file = path.join(OUT, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(r.data, "base64"));
  return file;
}
const brokenImages = () =>
  evaluate(`[...document.images].filter((i) => i.src.startsWith(location.origin) && i.complete && i.naturalWidth === 0).map((i) => i.src)`);

const results = [];
async function check(name, fn) {
  problems = [];
  warnings = [];
  let notes = [];
  try {
    notes = (await fn()) ?? [];
  } catch (err) {
    notes = [`failed: ${err.message}`];
  }
  for (const src of await brokenImages().catch(() => [])) problems.push(`broken image ${src}`);
  const bad = [...problems, ...notes.filter((n) => n.startsWith("failed"))];
  const details = [...problems, ...warnings.map((w) => `(not an error) ${w}`), ...notes];
  results.push({ name, ok: bad.length === 0, details });
  console.log(`${bad.length === 0 ? "ok  " : "FAIL"} ${name}${details.map((d) => `\n       ${d}`).join("")}`);
}
const expect = (cond, what) => (cond ? `checked: ${what}` : `failed: ${what}`);

/** Our own text says "live stream" (the Meetup description, quoted as written, is left out). */
const saysLiveStream = () =>
  evaluate(`(() => { const b = document.body.cloneNode(true); b.querySelectorAll('[data-meetup-text], script, iframe').forEach((x) => x.remove()); return /live[ -]?stream/i.test(b.textContent); })()`);

await viewport(1440, 900);

await check("home", async () => {
  await open("/", 1800);
  const s = await evaluate(`(() => ({
    allMeetups: !!document.querySelector('a[href="/meetups/"].btn'),
    navMeetups: !!document.querySelector('nav a[href="/meetups/"]'),
    navOrganizers: !!document.querySelector('nav a[href="/organizers/"]'),
    footerOrganizers: !!document.querySelector('footer a[href="/organizers/"]'),
    cardLink: !!document.querySelector('.event-card a.card-title-link[href="/meetups/${EVENT}/"]'),
    details: !!document.querySelector('.event-card a.event-btn[href="/meetups/${EVENT}/"]'),
    present: document.querySelectorAll('a[href^="/present/"], a[href^="/live/"]').length,
    hostLogo: [...document.querySelectorAll('.event-card .host-logo img')].map((i) => i.getAttribute("src")),
    avatars: [...document.querySelectorAll('.speaker-avatars img')].filter((i) => i.complete && i.naturalWidth > 0).map((i) => i.getAttribute("src")),
  }))()`);
  const file = await shot("01-home");
  return [
    expect(s.navMeetups, "nav links /meetups/"),
    expect(!s.navOrganizers, "/organizers/ is not in the main nav"),
    expect(s.footerOrganizers, '"For organizers" in the footer'),
    expect(s.allMeetups, '"All meetups" button'),
    expect(s.cardLink && s.details, 'the #53 card links to its page ("Meetup details")'),
    expect(s.present === 0, "no room-screen or live links on the start page"),
    expect(s.hostLogo.some((x) => x.endsWith("/rbi.svg")) && !s.hostLogo.some((x) => x.includes("raiffeisen_informatik")), `#53 card shows the RBI logo (${s.hostLogo.join(", ")})`),
    expect(s.avatars.some((x) => x.endsWith("/assets/speakers/darko-mesaros.png")), `community day speaker photos loaded (${s.avatars.map((x) => x.split("/").pop()).join(", ")})`),
    expect(!(await saysLiveStream()), 'no "live stream" text'),
    `screenshot ${file}`,
  ];
});

for (const [id, want] of [["aws-ug-vienna", "Next meetup"], ["aws-wug-vienna", "Last meetup"], ["aws-ug-linz", "Last meetup"]]) {
  await check(`group page ${id}`, async () => {
    await open(`/group/${id}/`, 1500);
    const s = await evaluate(`(() => ({
      present: document.querySelectorAll('a[href^="/present/"], a[href^="/live/"]').length,
      heading: [...document.querySelectorAll('.subsection-title')].map((h) => h.textContent),
      card: document.querySelector('.next-meetup-card-title')?.textContent ?? null,
      sessionize: /Sessionize integration/.test(document.body.innerText),
      breakRow: [...document.querySelectorAll('.agenda-row')].some((r) => /19:00 - 19:20/.test(r.textContent) && /Break/.test(r.textContent)),
      menu: [...document.querySelectorAll('nav .nav-menu-panel a')].map((a) => a.getAttribute('href')),
    }))()`);
    return [
      expect(s.heading.includes(want) && !!s.card, `${want}: ${s.card}`),
      expect(!s.sessionize, 'no "Sessionize integration will be connected soon"'),
      expect(s.breakRow, "the typical agenda has the break between the talks"),
      expect(["/group/aws-ug-vienna/", "/group/aws-wug-vienna/", "/group/aws-ug-linz/"].every((h) => s.menu.includes(h)), `"User Groups" menu: ${s.menu.join(", ")}`),
      expect(s.present === 0, "no room-screen or live links"),
      expect(!(await saysLiveStream()), 'no "live stream" text'),
    ];
  });
}

await check("meetups list", async () => {
  await open("/meetups/");
  const s = await evaluate(`(() => ({
    cards: document.querySelectorAll('.meetup-card').length,
    headings: [...document.querySelectorAll('.meetups-heading')].map((h) => h.textContent),
    title: document.title,
  }))()`);
  const file = await shot("02-meetups");
  return [
    expect(s.cards === meetups.length, `${s.cards} cards for ${meetups.length} meetups`),
    `sections: ${s.headings.join(", ")}`,
    expect(s.title.startsWith("Meetups"), `title "${s.title}"`),
    `screenshot ${file}`,
  ];
});

const expectedLogo = {
  [EVENT]: "rbi.svg",
  "2026-09-28-aws-meetup-vienna-52": "enspired.png",
  "2026-08-25-aws-user-group-vienna-presents-agentic-football-cup-2026": "doit.png",
  "2026-06-02-aws-meetup-vienna-51": "eversports.svg",
  "2026-04-22-aws-meetup-50": "bytesource.svg",
  "2026-03-17-aws-meetup-49": "raiffeisen_informatik.svg",
  "2025-11-05-10-years-aws-user-group-vienna": "bytesource.svg",
  "2025-08-07-aws-stammtisch": "labyrinth_labs.svg",
  "2025-06-16-aws-meetup-x-java-user-group-47": "tu_wien.svg",
  "2025-05-07-aws-meetup-46-workshop": "bytesource.svg",
  "2025-04-15-aws-meetup-45": "squer.svg",
};
/** As talksOf() in src/data/meetups.ts: from the agenda when there is one, else from meetup.json. */
const talksOf = (m) => {
  const fromAgenda = (m.evening?.agenda ?? []).filter((a) => a.talk).map((a) => a.talk);
  return fromAgenda.length ? fromAgenda : m.talks;
};
const talkCount = (m) => {
  const fromAgenda = (m.evening?.agenda ?? []).filter((a) => a.talk).length;
  return fromAgenda || m.talks.length;
};
for (const m of meetups) {
  await check(`meetup ${m.id}`, async () => {
    await open(`/meetups/${m.id}/`);
    const s = await evaluate(`(() => ({
      h1: document.querySelector('h1')?.textContent,
      present: document.querySelector('.organizers-line a[href^="/present/"]')?.getAttribute('href') ?? null,
      rehearse: [...document.querySelectorAll('.organizers-line a')].map((a) => a.getAttribute('href')).find((h) => h.includes('at=17:55')) ?? null,
      preview: document.querySelector('.live-header iframe')?.getAttribute('src') ?? null,
      oldPreview: !!document.querySelector('.room-preview'),
      deckLinks: [...document.querySelectorAll('a[href^="/decks/"]')].map((a) => a.getAttribute('href')),
      logos: [...document.querySelectorAll('.host-line img')].map((i) => i.getAttribute('src')),
      names: [...document.querySelectorAll('.host-line .host-name')].map((n) => n.textContent),
      talks: document.querySelectorAll('.talk-grid .talk-block').length,
      agenda: document.querySelectorAll('.agenda-list li').length,
      photos: [...document.querySelectorAll('.speaker-photo')].map((i) => i.getAttribute('src')),
      // A logo or photo that is in the page but draws nothing (no intrinsic size, broken file).
      blankLogos: [...document.querySelectorAll('.host-line img')].filter((i) => !i.complete || i.naturalWidth === 0 || i.getBoundingClientRect().width < 20).map((i) => i.getAttribute('src')),
      blankPhotos: [...document.querySelectorAll('.speaker-photo')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      speakersShown: document.querySelectorAll('.speaker-photo, .speaker-initials').length,
      empty: [...document.querySelectorAll('.meetup-section')].filter((x) => !x.querySelector('.container')?.children.length || x.innerText.trim().length < 3).length,
      // The open part of "About this meetup" (outside the folded full text).
      about: (() => { const a = document.querySelector('[data-meetup-text]'); if (!a) return null; const c = a.cloneNode(true); c.querySelectorAll('details').forEach((d) => d.remove()); return { text: c.innerText, folded: !!a.querySelector('details') }; })(),
    }))()`);
    const want = expectedLogo[m.id];
    const repeats = m.evening?.agenda.length && s.about
      ? [/^\s*agenda\b/im, /about the talk/i, /\b\d{1,2}:\d{2}\s*-\s*(?:\d{1,2}:\d{2}|open end)/i, ...talksOf(m).filter((t) => t.title.length >= 20).map((t) => new RegExp(t.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40), "i"))].filter((r) => r.test(s.about.text))
      : [];
    const notes = [
      ...(m.evening?.agenda.length && s.about ? [expect(repeats.length === 0, `"About this meetup" does not repeat the agenda or the talks${s.about.folded ? " (full text folded)" : ""}${repeats.length ? `: found ${repeats.join(", ")}` : ""}`)] : []),
      expect(s.h1 === m.title, "title"),
      expect(m.stream ? s.present === `/present/?event=${m.id}` : s.present === null, m.stream ? "organizers line: Present" : "no organizers line"),
      expect(m.stream ? s.rehearse === `/present/?event=${m.id}&at=17:55&speed=10` : s.rehearse === null, m.stream ? "organizers line: rehearse from 17:55" : "no rehearsal link"),
      expect(m.stream ? s.preview === `/present/?event=${m.id}&embed=1` : s.preview === null, m.stream ? `live header in the hero (${s.preview})` : "no live header (no agenda)"),
      expect(!s.oldPreview, "no second room-screen preview further down"),
      expect(m.deck ? s.deckLinks.length >= 2 && s.deckLinks.every((h) => h === m.deck) : s.deckLinks.length === 0, m.deck ? `slide deck PDF linked (${s.deckLinks.length}x ${m.deck})` : "no deck yet"),
      expect(s.talks === talkCount(m), `${s.talks} talks`),
      expect(s.blankLogos.length === 0, `host logos drawn${s.blankLogos.length ? " (blank: " + s.blankLogos.join(", ") + ")" : ""}`),
      expect(s.blankPhotos.length === 0, `speaker photos load${s.blankPhotos.length ? " (broken: " + s.blankPhotos.join(", ") + ")" : ""} (${s.photos.length} photos)`),
      expect(s.agenda === (m.evening?.agenda.length ?? 0), `${s.agenda} agenda lines`),
      expect(s.empty === 0, "no empty sections"),
      expect(!s.logos.some((x) => x.includes("raiffeisen_informatik")) || m.hosts.some((h) => /informatik|r-it/i.test(h.name)), "no Raiffeisen Informatik logo for another host"),
      expect(!(await saysLiveStream()), 'no "live stream" text'),
      `hosts: ${[...s.logos.map((x) => x.split("/").pop()), ...s.names].join(", ") || "none"}${s.photos.length ? `; speaker photos: ${s.photos.length}` : ""}`,
    ];
    if (want) notes.push(expect(s.logos.some((x) => x.endsWith(`/${want}`)), `host logo ${want}`));
    if (m.id === "2025-11-05-10-years-aws-user-group-vienna") notes.push(`screenshot ${await shot(`03-meetup-${m.id}`)}`);
    return notes;
  });
}

// The three designs of the meetup page, with real data, desktop and phone.
const DESIGNS = [
  ["a", "10-design-a", "11-design-a-mobile"],
  ["b", "12-design-b", "13-design-b-mobile"],
  ["c", "14-design-c", "15-design-c-mobile"],
];
for (const [d, desktop, mobile] of DESIGNS) {
  for (const [w, h, isMobile, name] of [[1440, 900, false, desktop], [390, 844, true, mobile]]) {
    await check(`design ${d} at ${w} px`, async () => {
      await viewport(w, h, isMobile);
      await open(`/meetups/${EVENT}/?design=${d}`, 1500);
      const s = await evaluate(`(() => ({
        design: document.querySelector('[data-design]')?.dataset.design,
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        photos: [...document.querySelectorAll('.speaker-photo, .speaker-card-photo')].filter((i) => i.complete && i.naturalWidth > 0).length,
        abstracts: document.querySelectorAll('.talk-abstract').length,
        timeline: document.querySelectorAll('.timeline-item').length,
        details: !!document.querySelector('details.meetup-details'),
      }))()`);
      // Let the live header load before the full-page shot.
      await sleep(3000);
      const scene = await evaluate(`(() => { const d = document.querySelector('.live-header iframe')?.contentDocument; const e = d?.querySelector('[data-embed]'); return e ? { scene: e.dataset.scene, source: e.dataset.source, countdown: d.querySelector('[data-countdown-top]')?.textContent ?? null } : null; })()`);
      const file = await shot(name);
      const notes = [
        expect(s.design === d, `design ${s.design}`),
        expect(!s.overflow, "no horizontal scroll"),
        expect(s.photos >= 3, `${s.photos} speaker photos`),
        expect(s.abstracts === 2, `${s.abstracts} abstracts`),
        ...(d === "a" ? [expect(scene?.source === "tour" && scene.scene === "PreShow" && /^Starts in\d/.test(scene.countdown ?? ""), `live header: ${JSON.stringify(scene)}`)] : []),
        `screenshot ${file}`,
      ];
      if (d === "b") notes.push(expect(s.timeline === 7 && s.details, `timeline ${s.timeline} items, description folded`));
      return notes;
    });
  }
}
// Every agenda line and every speaker opens its details in a dialog, desktop and phone.
const DIALOG_STATE = `(() => {
  const d = document.querySelector('dialog.agenda-dialog');
  const body = d?.querySelector('.agenda-dialog-body');
  return {
    open: !!d?.open,
    title: d?.querySelector('#agenda-dialog-title')?.textContent ?? null,
    blocks: [...(d?.querySelectorAll('.agenda-dialog-block h3') ?? [])].map((h) => h.textContent),
    links: [...(d?.querySelectorAll('.profile-link') ?? [])].map((a) => a.textContent),
    bios: d?.querySelectorAll('.speaker-profile-bio').length ?? 0,
    badges: [...(d?.querySelectorAll('.badge-grid img') ?? [])].filter((i) => i.complete && i.naturalWidth > 0).length,
    leaders: [...(d?.querySelectorAll('.leader-chip') ?? [])].map((c) => c.textContent),
    leaderPhotos: [...(d?.querySelectorAll('.leader-chip img') ?? [])].filter((i) => i.complete && i.naturalWidth > 0).length,
    cards: [...(d?.querySelectorAll('.leader-card') ?? [])].map((c) => ({ name: c.querySelector('.leader-card-name')?.textContent, role: c.querySelector('.leader-card-role')?.textContent, photo: !!c.querySelector('img')?.naturalWidth })),
    pacman: !!d?.querySelector('.pacman-circle'),
    involved: !!d?.querySelector('.get-involved a[href^="https://sessionize.com/"]') && !!d?.querySelector('.get-involved a[href="/prep-guide/"]'),
    hash: location.hash,
    wide: d ? d.getBoundingClientRect().width > window.innerWidth + 1 || (body && body.scrollWidth > body.clientWidth + 1) : false,
  };
})()`;
for (const [w, h, isMobile, prefix] of [[1440, 900, false, "16-dialog"], [390, 844, true, "17-dialog-mobile"]]) {
  await check(`agenda details at ${w} px`, async () => {
    await viewport(w, h, isMobile);
    await open(`/meetups/${EVENT}/`, 1500);
    const lines = await evaluate(`[...document.querySelectorAll('.agenda-list button.agenda-open')].map((b) => b.textContent)`);
    const notes = [expect(lines.length === 7, `${lines.length} agenda lines open details`)];
    const want = {
      0: ["Stand like Pac-Man", "Growing Together: One Respectful Interaction at a Time", "The organizers"],
      1: ["Our user groups", "AWS Student Builder Groups", "Our badges", "AWS Community Days"],
      3: ["The speakers"],
      4: ["Food for everyone", "Stand like Pac-Man"],
      6: ["Thank you to our host", "Thank you", "Next meetup"],
    };
    // Opening and closing never move the page.
    await evaluate(`document.querySelector('.agenda-list').scrollIntoView({ block: 'center' })`);
    await sleep(300);
    const scrolls = [];
    for (let i = 0; i < lines.length; i++) {
      const before = await evaluate(`scrollY`);
      await evaluate(`document.querySelectorAll('.agenda-list button.agenda-open')[${i}].click()`);
      await sleep(400);
      const st = await evaluate(DIALOG_STATE);
      scrolls.push([before, await evaluate(`scrollY`)]);
      const blocks = want[i] ?? [];
      notes.push(
        expect(st.open && st.involved && !st.wide && blocks.every((b) => st.blocks.includes(b)) && /^#agenda-/.test(st.hash), `"${st.title}" (${st.hash}): ${st.blocks.join(", ") || "no sections"}`),
      );
      if (i === 1) notes.push(expect(st.badges === 5, `${st.badges} badges shown`));
      // Wherever a dialog tells people to ask the leaders, they are shown: photo and first name.
      // The welcome introduces the leaders: a card each with photo, full name and role.
      if (i === 1) notes.push(expect(st.cards.length >= 6 && st.cards.every((c) => c.name && c.role && c.photo), `leader cards: ${st.cards.map((c) => c.name).join(", ")}`));
      if (i === 0) notes.push(expect(st.leaders.length >= 6 && st.leaders.length < 12, `the organizers once in the entry dialog (${st.leaders.length} chips)`));
      if (i === 6) notes.push(expect(st.blocks.includes("Thank you to our host"), "the host thanked at the closing networking"));
      if ([0, 4, 6].includes(i)) notes.push(expect(st.leaders.length >= 6 && st.leaderPhotos === st.leaders.length && st.leaders.every((n) => !n.includes(" ")), `leaders shown: ${[...new Set(st.leaders)].join(", ")}`));
      if ([0, 4].includes(i)) notes.push(expect(st.pacman, "the Pac-Man drawing"));
      if (i === 3) notes.push(expect(st.bios === 2 && st.links.filter((l) => l === "LinkedIn").length === 2, `${st.bios} bios, links ${st.links.join(", ")}`));
      if (i === 6) notes.push(expect(await evaluate(`!!document.querySelector('dialog.agenda-dialog a[href="${meetups.find((x) => x.id === EVENT).meetupUrl}"]')`), "feedback link to the Meetup event"));
      if ([0, 3, 4, 6].includes(i)) notes.push(`screenshot ${await shot(`${prefix}-${["doors", , , "talk", "break", , "networking"][i]}`, false)}`);
      await evaluate(`document.querySelector('dialog.agenda-dialog .agenda-dialog-close').click()`);
      await sleep(400);
      scrolls[i].push(await evaluate(`scrollY`));
    }
    const closed = await evaluate(DIALOG_STATE);
    notes.push(expect(!closed.open && closed.hash === "", "closes with its button, and the address loses its hash"));
    notes.push(expect(scrolls.every(([a, b, c]) => a === b && b === c && a > 0), `the page stays where it was while open and after closing (scrollY ${scrolls.map((x) => x.join("/")).join(", ")})`));
    // A speaker in the agenda opens the speaker; the speaker's talk opens the talk.
    await evaluate(`[...document.querySelectorAll('.agenda-list .agenda-speaker')].find((b) => b.textContent === 'Darko Mesaroš').click()`);
    await sleep(400);
    const sp = await evaluate(DIALOG_STATE);
    notes.push(expect(sp.open && sp.title === "Darko Mesaroš" && sp.bios === 1 && sp.links.includes("LinkedIn") && sp.hash === "#speaker-darko-mesaros", `speaker "${sp.title}" (${sp.hash}), links ${sp.links.join(", ")}`));
    await evaluate(`document.querySelector('dialog.agenda-dialog .dialog-list-button').click()`);
    await sleep(400);
    const talk = await evaluate(DIALOG_STATE);
    notes.push(expect(talk.title === "I don't trust my agents!" && talk.hash === "#agenda-talk-2", `from the speaker to the talk "${talk.title}"`));
    await evaluate(`document.querySelector('dialog.agenda-dialog').close()`);
    // A link with the hash opens the dialog on load.
    await open(`/meetups/${EVENT}/#speaker-mladen-trampic`, 1500);
    const linked = await evaluate(DIALOG_STATE);
    notes.push(expect(linked.open && linked.title === "Mladen Trampic" && linked.links.length >= 2, `#speaker-mladen-trampic opens "${linked.title}" (${linked.links.join(", ")})`));
    notes.push(`screenshot ${await shot(`${prefix}-speaker`, false)}`);
    return notes;
  });
}

await viewport(1440, 900);

for (const [w, h, isMobile, name] of [[1440, 900, false, "18-prep-guide"], [390, 844, true, "19-prep-guide-mobile"]]) {
  await check(`prep guide at ${w} px`, async () => {
    await viewport(w, h, isMobile);
    await open("/prep-guide/", 1500);
    await evaluate(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500)); })()`);
    const s = await evaluate(`(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      pdf: [...document.querySelectorAll('a[href^="https://drive.google.com/file/d/1vT2p8i-1nj5cjHWILy1OYx4dWNCIeOo9"]')].length,
      stack: [...document.querySelectorAll('.pg-stack img')].filter((i) => i.complete && i.naturalWidth > 0).length,
      steps: document.querySelectorAll('.pg-step').length,
      pictures: [...document.querySelectorAll('.prep-guide img')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      links: ['https://sessionize.com/aws-community-austria', 'https://www.linkedin.com/company/aws-user-group-vienna', 'https://www.meetup.com/amazon-web-services-aws-vienna/'].filter((u) => !document.querySelector('.prep-guide a[href="' + u + '"]')),
      example: document.querySelector('.prep-guide a[href^="/meetups/2"]')?.getAttribute('href') ?? null,
    }))()`);
    return [
      expect(!s.overflow, "no horizontal scroll"),
      expect(s.pdf >= 3 && s.stack === 3, `PDF linked ${s.pdf}x, its pages stacked in the hero (${s.stack})`),
      expect(s.steps === 6, `${s.steps} timeline steps`),
      expect(s.pictures.length === 0, s.pictures.length ? `images not loading: ${s.pictures.join(", ")}` : "every picture loads"),
      expect(s.links.length === 0, s.links.length ? `missing links: ${s.links.join(", ")}` : "Sessionize, LinkedIn and Meetup linked"),
      expect(!!s.example, `example meetup page linked (${s.example})`),
      `screenshot ${await shot(name)}`,
    ];
  });
}
await viewport(1440, 900);

await check("organizers page", async () => {
  await open("/organizers/");
  const s = await evaluate(`(() => ({
    noindex: document.querySelector('meta[name="robots"]')?.content ?? null,
    present: document.querySelectorAll('.organizer-list a[href^="/present/?event="]').length,
    howto: document.querySelectorAll('.howto li').length,
    deck: !!document.querySelector('#deck .howto code'),
    deckOptions: document.querySelectorAll('.deck-picker select option').length,
    deckPreview: document.querySelector('.deck-picker-preview')?.getAttribute('href') ?? null,
    deckCover: (() => { const i = document.querySelector('.deck-picker-preview img'); return i && i.complete && i.naturalWidth > 0 ? i.getAttribute('src') : null; })(),
  }))()`);
  const html = await (await fetch(`${BASE}/organizers/`)).text();
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  const streams = meetups.filter((m) => m.stream).length;
  return [
    expect(s.noindex === "noindex" && html.includes('<meta name="robots" content="noindex" />'), "noindex (page and prerendered HTML)"),
    expect(!sitemap.includes("/organizers/") && !sitemap.includes("/present/"), "not in the sitemap"),
    expect(/Disallow: \/present\//.test(robots) && !robots.includes("/live/"), "robots.txt keeps /present/ out"),
    expect(s.present === streams * 2, `${s.present} Present and rehearsal links for ${streams} meetups`),
    expect(s.howto === 8, `${s.howto} how-to lines (room screen and slide deck)`),
    expect(s.deck, "how to make the slide deck (#deck)"),
    expect(s.deckOptions === meetups.filter((m) => m.deck).length && s.deckOptions > 0 && /^\/decks\/[a-z0-9-]+\.pdf$/.test(s.deckPreview ?? "") && s.deckCover === s.deckPreview.replace(/\.pdf$/, ".png"), `deck picker: ${s.deckOptions} meetups, showing ${s.deckCover} linked to ${s.deckPreview}`),
    expect(!(await saysLiveStream()), 'no "live stream" text'),
    `screenshot ${await shot("05-organizers")}`,
  ];
});

await check("Present link leads to /present/", async () => {
  await open(`/meetups/${EVENT}/`);
  await evaluate(`document.querySelector('.organizers-line a[href^="/present/"]').click()`);
  await sleep(3500);
  const s = await evaluate(`({ path: location.pathname, search: location.search, title: document.title })`);
  const file = await shot("06-present", false);
  return [expect(s.path === "/present/" && s.search === `?event=${EVENT}`, `now at ${s.path}${s.search} ("${s.title}")`), `screenshot ${file}`];
});

await check("room screen at 17:55", async () => {
  await open(`/present/?event=${EVENT}&at=17:55`, 3500);
  const scene = await evaluate(`document.querySelector('[data-scene]')?.dataset.scene ?? null`);
  return [expect(scene === "PreShow", `scene ${scene}`), `screenshot ${await shot("07-present-1755", false)}`];
});

await check("/live/ is gone", async () => [
  expect(!fs.existsSync(path.join(ROOT, "dist", "live")) && !fs.existsSync(path.join(ROOT, "public", "live")), "no live/ folder in public/ or dist/"),
]);

await viewport(390, 844, true);
await check("mobile: meetups list", async () => {
  await open("/meetups/");
  const overflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth + 1`);
  return [expect(!overflow, "no horizontal scroll"), `screenshot ${await shot("08-mobile-meetups")}`];
});
await check("mobile: home", async () => {
  await open("/", 1800);
  const overflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth + 1`);
  return [expect(!overflow, "no horizontal scroll"), `screenshot ${await shot("09-mobile-home")}`];
});

// A reload of /meetups/<id>/ gets the prerendered HTML (no JavaScript involved).
await check("reload serves prerendered HTML", async () => {
  const html = await (await fetch(`${BASE}/meetups/${EVENT}/`)).text();
  const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  const event = ld ? JSON.parse(ld) : null;
  const noSlash = await fetch(`${BASE}/meetups/${EVENT}`, { redirect: "manual" });
  return [
    expect(/<title>AWS Meetup Vienna #53 - hosted by RBI \| AWS Community Austria<\/title>/.test(html), "<title>"),
    expect(html.includes(`<link rel="canonical" href="https://awscommunity.at/meetups/${EVENT}/" />`), "canonical"),
    expect(event?.["@type"] === "Event" && event.startDate === "2026-10-20T17:00:00+02:00", "JSON-LD Event"),
    expect(html.includes('<meta property="og:image" content="https://secure.meetupstatic.com/'), "og:image"),
    expect(/<div id="root"><main class="prerender">[\s\S]*<h1>AWS Meetup Vienna #53/.test(html), "page text in #root"),
    expect(html.includes("<h2>Agenda</h2>") && html.includes("AWS DevOps Agent is"), "agenda and abstracts in the prerendered text"),
    expect(!/live[ -]?stream/i.test(html), 'no "live stream" in the HTML'),
    expect(noSlash.status === 301 && noSlash.headers.get("location") === `/meetups/${EVENT}/`, `no trailing slash redirects (${noSlash.status})`),
  ];
});

console.log(`\nexternal hosts answered locally: ${[...external].sort().join(", ") || "none"}`);
console.log(`screenshots in ${OUT}`);
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `${failed.length} of ${results.length} checks failed` : `all ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
