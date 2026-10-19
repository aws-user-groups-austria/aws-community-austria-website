/**
 * A small markdown reader for Meetup event descriptions, shared by the React
 * pages (src/components/Markdown.tsx) and the build-time prerender
 * (scripts/prerender-meetups.mjs). Plain JavaScript so Node runs it without a
 * build step; types in markdown.d.ts.
 *
 * It understands what Meetup descriptions use: paragraphs (a single newline is
 * a line break), headings (#), bullet and numbered lists, horizontal rules
 * (***), bold, italic, inline code, links [text](url), bare https links, and
 * backslash escapes. Everything else is text. The output is a tree of plain
 * objects, never HTML: React renders it as elements, and toHtml() escapes every
 * piece of text, so nothing in a description can inject markup. Links keep
 * only http(s) and mailto URLs.
 */

const ESCAPABLE = "\\`*_{}[]()#+-.!|~<>\"'&,:;=?@$%^/";

/** The href if it is http(s) or mailto, else null. */
export function safeHref(url) {
  const u = String(url).trim();
  return /^(https?:\/\/|mailto:)[^\s<>"]+$/i.test(u) ? u : null;
}

/** Inline markdown to nodes: text, strong, em, code, link, br. Inside a link's text, no further links. */
export function parseInline(src, inLink = false) {
  const out = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ type: "text", value: text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const rest = src.slice(i);

    if (c === "\\" && i + 1 < src.length && ESCAPABLE.includes(src[i + 1])) {
      text += src[i + 1];
      i += 2;
      continue;
    }
    if (c === "\n") {
      flush();
      out.push({ type: "br" });
      i += 1;
      continue;
    }
    if (c === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "code", value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (c === "[" && !inLink) {
      const close = matchBracket(src, i, "[", "]");
      if (close > i && src[close + 1] === "(") {
        const end = matchBracket(src, close + 1, "(", ")");
        if (end > close + 1) {
          const href = safeHref(src.slice(close + 2, end));
          const children = parseInline(src.slice(i + 1, close), true);
          flush();
          if (href) out.push({ type: "link", href, children });
          else out.push(...children);
          i = end + 1;
          continue;
        }
      }
    }
    if (rest.startsWith("**") || rest.startsWith("__")) {
      const d = rest.slice(0, 2);
      const end = src.indexOf(d, i + 2);
      if (end > i + 2 && src.slice(i + 2, end).trim()) {
        flush();
        out.push({ type: "strong", children: parseInline(src.slice(i + 2, end).trim(), inLink) });
        i = end + 2;
        continue;
      }
    }
    if ((c === "*" || c === "_") && src[i + 1] !== c && src[i + 1] !== " " && !(c === "_" && /\w/.test(src[i - 1] ?? ""))) {
      const end = closingEmphasis(src, i, c);
      if (end !== -1) {
        flush();
        out.push({ type: "em", children: parseInline(src.slice(i + 1, end), inLink) });
        i = end + 1;
        continue;
      }
    }
    if (!inLink && (c === "h" || c === "H") && /^https?:\/\//i.test(rest) && !/[\w/]/.test(src[i - 1] ?? "")) {
      const m = rest.match(/^https?:\/\/[^\s<>"]+/i);
      const url = m[0].replace(/[.,;:!?)\]*]+$/, "");
      const href = safeHref(url);
      if (href) {
        flush();
        out.push({ type: "link", href, children: [{ type: "text", value: url }] });
        i += url.length;
        continue;
      }
    }
    text += c;
    i += 1;
  }
  flush();
  return out;
}

/** Index of the single * or _ that closes the one at `open`, or -1. Not part of a ** pair, not after a space. */
function closingEmphasis(src, open, c) {
  for (let j = open + 2; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (src[j] === "\n" && src[j - 1] === "\n") return -1;
    if (src[j] !== c || src[j + 1] === c || src[j - 1] === c || src[j - 1] === " ") continue;
    if (c === "_" && /\w/.test(src[j + 1] ?? "")) continue;
    return j;
  }
  return -1;
}

/** Index of the bracket that closes the one at `open` (nesting counted, escapes skipped), or -1. */
function matchBracket(src, open, left, right) {
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (src[j] === "\n" && src[j + 1] === "\n") return -1;
    if (src[j] === left) depth++;
    else if (src[j] === right && --depth === 0) return j;
  }
  return -1;
}

const HR = /^\s{0,3}([*_-])(\s*\1){2,}\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const BULLET = /^\s{0,3}[*+-]\s+(.*)$/;
const NUMBER = /^\s{0,3}\d{1,3}[.)]\s+(.*)$/;

/**
 * Markdown to blocks: { type: "p", children }, { type: "h", level, children },
 * { type: "ul" | "ol", items: children[] }, { type: "hr" }.
 * Heading levels are as written (1 to 6); the renderer decides the tag.
 */
export function parseMarkdown(src) {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  let list = null;

  const endPara = () => {
    if (para.length) blocks.push({ type: "p", children: parseInline(para.join("\n").trim()) });
    para = [];
  };
  const endList = () => {
    if (list) blocks.push({ type: list.type, items: list.items.map((t) => parseInline(t.trim())) });
    list = null;
  };

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (!line.trim()) {
      endPara();
      // A list continues across blank lines when the next text line is another item of the same kind.
      if (list) {
        let k = n + 1;
        while (k < lines.length && !lines[k].trim()) k++;
        const next = lines[k] ?? "";
        const same = list.type === "ul" ? BULLET.test(next) && !HR.test(next) : NUMBER.test(next);
        if (!same) endList();
      }
      continue;
    }
    if (HR.test(line)) {
      endPara();
      endList();
      blocks.push({ type: "hr" });
      continue;
    }
    const h = line.match(HEADING);
    if (h) {
      endPara();
      endList();
      blocks.push({ type: "h", level: h[1].length, children: parseInline(h[2]) });
      continue;
    }
    const b = line.match(BULLET);
    const o = b ? null : line.match(NUMBER);
    if (b || o) {
      endPara();
      const type = b ? "ul" : "ol";
      if (list && list.type !== type) endList();
      if (!list) list = { type, items: [] };
      list.items.push((b ?? o)[1]);
      continue;
    }
    if (list) {
      list.items[list.items.length - 1] += `\n${line.trim()}`;
      continue;
    }
    para.push(line);
  }
  endPara();
  endList();
  return blocks.filter((b) => b.type !== "p" || b.children.length > 0);
}

/** The text of inline nodes, without markup. */
export function inlineText(nodes) {
  return nodes.map((n) => (n.type === "text" || n.type === "code" ? n.value : n.type === "br" ? " " : inlineText(n.children))).join("");
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Heading tag for a markdown heading level inside a page section (the page has h1 and h2 already). */
export function headingTag(level) {
  return level <= 2 ? "h3" : "h4";
}

function inlineHtml(nodes) {
  return nodes
    .map((n) => {
      switch (n.type) {
        case "text":
          return escapeHtml(n.value);
        case "br":
          return "<br>";
        case "code":
          return `<code>${escapeHtml(n.value)}</code>`;
        case "strong":
          return `<strong>${inlineHtml(n.children)}</strong>`;
        case "em":
          return `<em>${inlineHtml(n.children)}</em>`;
        case "link":
          return `<a href="${escapeHtml(n.href)}" rel="noopener noreferrer">${inlineHtml(n.children)}</a>`;
        default:
          return "";
      }
    })
    .join("");
}

/** Blocks to escaped HTML, for the prerendered pages. */
export function toHtml(blocks) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "p":
          return `<p>${inlineHtml(b.children)}</p>`;
        case "h": {
          const tag = headingTag(b.level);
          return `<${tag}>${inlineHtml(b.children)}</${tag}>`;
        }
        case "ul":
        case "ol":
          return `<${b.type}>${b.items.map((it) => `<li>${inlineHtml(it)}</li>`).join("")}</${b.type}>`;
        case "hr":
          return "<hr>";
        default:
          return "";
      }
    })
    .join("\n");
}
