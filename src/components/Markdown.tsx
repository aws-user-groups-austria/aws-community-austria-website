import { Fragment, type ReactNode } from "react";
import { parseMarkdown, headingTag, type Block, type Inline } from "../lib/markdown.js";

/**
 * A Meetup description rendered as React elements from src/lib/markdown.js.
 * No HTML from the description reaches the page: every piece is a text node
 * or one of a few elements, and links keep only http(s) and mailto URLs.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return <div className={className}>{parseMarkdown(source).map(block)}</div>;
}

function block(b: Block, i: number): ReactNode {
  switch (b.type) {
    case "p":
      return <p key={i}>{inline(b.children)}</p>;
    case "h": {
      const Tag = headingTag(b.level);
      return <Tag key={i}>{inline(b.children)}</Tag>;
    }
    case "ul":
      return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
    case "ol":
      return <ol key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>;
    case "hr":
      return <hr key={i} />;
  }
}

function inline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "text":
        return <Fragment key={i}>{n.value}</Fragment>;
      case "br":
        return <br key={i} />;
      case "code":
        return <code key={i}>{n.value}</code>;
      case "strong":
        return <strong key={i}>{inline(n.children)}</strong>;
      case "em":
        return <em key={i}>{inline(n.children)}</em>;
      case "link":
        return (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="text-link">
            {inline(n.children)}
          </a>
        );
    }
  });
}
