/** Types for markdown.js (plain JavaScript so the build-time prerender can run it in Node). */

export type Inline =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "br" }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "p"; children: Inline[] }
  | { type: "h"; level: number; children: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] }
  | { type: "hr" };

export function safeHref(url: string): string | null;
export function parseInline(src: string, inLink?: boolean): Inline[];
export function parseMarkdown(src: string | undefined | null): Block[];
export function inlineText(nodes: Inline[]): string;
export function escapeHtml(s: string): string;
export function headingTag(level: number): "h3" | "h4";
export function toHtml(blocks: Block[]): string;
