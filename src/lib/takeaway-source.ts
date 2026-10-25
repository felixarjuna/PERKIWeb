/** Turns a Google Doc's HTML export into dated Markdown entries.
 *
 * Uses happy-dom, not jsdom: jsdom's dependencies `require()` ES modules,
 * which Vercel's Node runtime refuses, so jsdom can't load in production.
 */
import { type Element, type Node, Window } from "happy-dom";
import type { SourceEntry, TakeawaySource } from "./takeaway-import";

const HEADING_TAG = /^H[1-6]$/;
/** Head-only tags a fragment can leave in the body; they hold no text. */
const NON_CONTENT_TAGS = new Set(["LINK", "META", "STYLE", "TITLE"]);
const SOURCE_DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/;
const MARKDOWN_SPECIAL = /[\\`*_[\]<>~]/g;
const NON_BREAKING_SPACE = /\u00a0/g;
const WHITESPACE = /\s+/g;
const BOLD_WEIGHT = 600;
const OUTER_WHITESPACE = /^(\s*)([\s\S]*?)(\s*)$/;

function inlineMarkdown(node: Node, window: Window): string {
  if (node.nodeType === 3) {
    return (node.textContent ?? "")
      .replace(NON_BREAKING_SPACE, " ")
      .replace(MARKDOWN_SPECIAL, "\\$&");
  }
  if (!(node instanceof window.HTMLElement)) {
    return "";
  }
  if (node.tagName === "BR") {
    return "\n";
  }
  const text = [...node.childNodes]
    .map((child) => inlineMarkdown(child, window))
    .join("");
  if (!text.trim()) {
    return text;
  }
  const style = window.getComputedStyle(node);
  const parentStyle = node.parentElement
    ? window.getComputedStyle(node.parentElement)
    : null;
  const bold =
    ["B", "STRONG"].includes(node.tagName) ||
    (Number(style.fontWeight) >= BOLD_WEIGHT &&
      !(Number(parentStyle?.fontWeight) >= BOLD_WEIGHT));
  const italic =
    ["I", "EM"].includes(node.tagName) ||
    (style.fontStyle === "italic" && parentStyle?.fontStyle !== "italic");
  const whitespace = OUTER_WHITESPACE.exec(text);
  let formatted = text.trim();
  if (bold) {
    formatted = `**${formatted}**`;
  }
  if (italic) {
    formatted = `*${formatted}*`;
  }
  if (node.tagName === "A") {
    const href = node.getAttribute("href");
    if (href) {
      const target = new URL(href);
      if (!["https:", "http:", "mailto:"].includes(target.protocol)) {
        throw new Error("Unsupported source link protocol.");
      }
      return `[${formatted}](<${target.href}>)`;
    }
  }
  return `${whitespace?.[1] ?? ""}${formatted}${whitespace?.[3] ?? ""}`;
}

function blockMarkdown(element: Element, window: Window): string {
  if (!element.textContent?.trim() && element.tagName !== "HR") {
    return "";
  }
  if (["OL", "UL"].includes(element.tagName)) {
    return [...element.children]
      .map((child, index) => {
        if (child.tagName !== "LI") {
          throw new Error("Unsupported source list structure.");
        }
        const marker = element.tagName === "OL" ? `${index + 1}.` : "-";
        return `${marker} ${inlineMarkdown(child, window).trim()}`;
      })
      .join("\n");
  }
  if (element.tagName === "HR") {
    return "";
  }
  const content = inlineMarkdown(element, window).trim();
  if (HEADING_TAG.test(element.tagName)) {
    return `${"#".repeat(Number(element.tagName.slice(1)))} ${content}`;
  }
  if (!["P", "DIV"].includes(element.tagName)) {
    throw new Error(`Unsupported source block: ${element.tagName}`);
  }
  return content;
}

function headingDate(heading: string): string | undefined {
  const match = SOURCE_DATE.exec(heading);
  if (!match) {
    return;
  }
  const date = `${match[3]}-${match[2]?.padStart(2, "0")}-${match[1]?.padStart(2, "0")}`;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Invalid source date: ${heading}`);
  }
  return date;
}

function requireEntryBody(entry: SourceEntry | undefined, bodyBlocks: number) {
  if (entry && bodyBlocks === 0) {
    throw new Error(`Empty source entry: ${entry.heading}`);
  }
}

function mergeSourceSpans(window: Window) {
  for (const span of window.document.querySelectorAll("span")) {
    let next = span.nextSibling;
    while (
      next instanceof window.HTMLElement &&
      next.tagName === "SPAN" &&
      next.className === span.className &&
      next.getAttribute("style") === span.getAttribute("style")
    ) {
      span.append(...next.childNodes);
      next.remove();
      next = span.nextSibling;
    }
  }
}

/** Parse only: never run scripts or fetch stylesheets, scripts, images or frames. */
const OFFLINE_SETTINGS = {
  disableCSSFileLoading: true,
  disableIframePageLoading: true,
  disableJavaScriptFileLoading: true,
  enableImageFileLoading: false,
  enableJavaScriptEvaluation: false,
  handleDisabledFileLoadingAsSuccess: true,
  navigation: {
    disableChildFrameNavigation: true,
    disableChildPageNavigation: true,
    disableMainFrameNavigation: true,
  },
};

export function parseTakeawaySource(html: string): TakeawaySource {
  const window = new Window({ settings: OFFLINE_SETTINGS });
  window.document.write(html);
  try {
    if (
      window.document.body.querySelector(
        "img, table, iframe, svg, script, object"
      )
    ) {
      throw new Error(
        "Unsupported embedded source content; review the HTML export."
      );
    }
    mergeSourceSpans(window);
    const instructions: string[] = [];
    const entries: SourceEntry[] = [];
    let current: SourceEntry | undefined;
    let bodyBlocks = 0;
    for (const element of window.document.body.children) {
      if (NON_CONTENT_TAGS.has(element.tagName)) {
        continue;
      }
      const heading = (element.textContent ?? "")
        .replace(WHITESPACE, " ")
        .trim();
      const date = HEADING_TAG.test(element.tagName)
        ? headingDate(heading)
        : undefined;
      const block = blockMarkdown(element, window);
      if (!block) {
        continue;
      }
      if (date) {
        requireEntryBody(current, bodyBlocks);
        if (entries.some((entry) => entry.date === date)) {
          throw new Error(`Duplicate source date: ${date}`);
        }
        current = {
          content: block,
          date,
          heading,
        };
        entries.push(current);
        bodyBlocks = 0;
        continue;
      }
      if (current) {
        current.content += `\n\n${block}`;
        bodyBlocks += 1;
      } else {
        instructions.push(block);
      }
    }
    if (!current || bodyBlocks === 0) {
      throw new Error("Empty source document or final entry.");
    }
    return { entries, instructions: instructions.join("\n\n") };
  } finally {
    window.happyDOM.abort();
    window.close();
  }
}
