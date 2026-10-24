/** Offline Google Docs parsing and planning; never opens a database connection. */
import { JSDOM } from "jsdom";

const HEADING_TAG = /^H[1-6]$/;
const SOURCE_DATE = /\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/;
const MARKDOWN_SPECIAL = /[\\`*_[\]<>~]/g;
const NON_BREAKING_SPACE = /\u00a0/g;
const WHITESPACE = /\s+/g;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const BOLD_WEIGHT = 600;
const OUTER_WHITESPACE = /^(\s*)([\s\S]*?)(\s*)$/;

export interface SourceEntry {
  content: string;
  date: string;
  heading: string;
}

export interface TakeawaySource {
  entries: SourceEntry[];
  instructions: string;
}

export interface SourcePair {
  date: string;
  notes: SourceEntry;
  tldr: SourceEntry;
}

interface ImportSchedule {
  date: string;
  id: number;
}

interface ExistingTakeaway {
  id: number;
  keypoints: string;
  scheduleId: number;
  tldr: string | null;
}

export interface ImportPlanRow {
  action: "insert" | "skip" | "blocked";
  date: string;
  notes: SourceEntry;
  reason: string;
  scheduleId?: number;
  tldr: SourceEntry;
}

export function assertLocalImportDatabase(url: string) {
  const parsed = new URL(url);
  if (
    !LOCAL_HOSTS.has(parsed.hostname) ||
    parsed.port !== "54320" ||
    parsed.pathname !== "/perkiweb_dev" ||
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    parsed.search
  ) {
    throw new Error(
      "Import is restricted to the local dev database on port 54320."
    );
  }
}

function inlineMarkdown(node: Node, window: JSDOM["window"]): string {
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

function blockMarkdown(element: Element, window: JSDOM["window"]): string {
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

function mergeSourceSpans(window: JSDOM["window"]) {
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

export function parseTakeawaySource(html: string): TakeawaySource {
  const dom = new JSDOM(html);
  try {
    if (
      dom.window.document.body.querySelector(
        "img, table, iframe, svg, script, object"
      )
    ) {
      throw new Error(
        "Unsupported embedded source content; review the HTML export."
      );
    }
    mergeSourceSpans(dom.window);
    const instructions: string[] = [];
    const entries: SourceEntry[] = [];
    let current: SourceEntry | undefined;
    let bodyBlocks = 0;
    for (const element of dom.window.document.body.children) {
      const heading = (element.textContent ?? "")
        .replace(WHITESPACE, " ")
        .trim();
      const date = HEADING_TAG.test(element.tagName)
        ? headingDate(heading)
        : undefined;
      const block = blockMarkdown(element, dom.window);
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
    dom.window.close();
  }
}

export function pairTakeawaySources(
  notes: TakeawaySource,
  tldr: TakeawaySource,
  corrections: Record<string, string> = {}
): SourcePair[] {
  const summaries = new Map<string, SourceEntry>();
  for (const entry of tldr.entries) {
    const date = corrections[entry.date] ?? entry.date;
    if (summaries.has(date)) {
      throw new Error(`Duplicate corrected TL;DR date: ${date}`);
    }
    summaries.set(date, entry);
  }
  const dates = new Set<string>();
  const pairs = notes.entries.map((entry) => {
    const date = corrections[entry.date] ?? entry.date;
    const summary = summaries.get(date);
    if (!summary || dates.has(date)) {
      throw new Error(`Unmatched or duplicate note date: ${date}`);
    }
    dates.add(date);
    summaries.delete(date);
    return { date, notes: entry, tldr: summary };
  });
  if (summaries.size) {
    throw new Error(
      `Unmatched TL;DR dates: ${[...summaries.keys()].join(", ")}`
    );
  }
  return pairs;
}

export function planTakeawayImport(
  pairs: SourcePair[],
  schedules: ImportSchedule[],
  existing: ExistingTakeaway[]
): ImportPlanRow[] {
  return pairs.map((pair) => {
    const matches = schedules.filter(
      (candidate) => candidate.date === pair.date
    );
    const [schedule] = matches;
    if (matches.length !== 1 || !schedule) {
      return {
        ...pair,
        action: "blocked",
        reason: `${matches.length} matching gatherings`,
      };
    }
    const takeaways = existing.filter((row) => row.scheduleId === schedule.id);
    if (!takeaways.length) {
      return {
        ...pair,
        action: "insert",
        reason: "No existing takeaway",
        scheduleId: schedule.id,
      };
    }
    const same =
      takeaways.length === 1 &&
      takeaways[0]?.keypoints === pair.notes.content &&
      takeaways[0]?.tldr === pair.tldr.content;
    return {
      ...pair,
      action: same ? "skip" : "blocked",
      reason: same
        ? "Already imported; unchanged"
        : "Existing takeaway differs; preserved",
      scheduleId: schedule.id,
    };
  });
}

interface DocsSchedule {
  /** The gathering's day in Aachen, `yyyy-MM-dd`. */
  day: string;
  id: number;
}

interface StoredTakeaway extends ExistingTakeaway {
  status: "draft" | "in_review" | "published";
}

export type DocsImportStatus =
  | "new"
  | "changed"
  | "unchanged"
  | "published"
  | "skipped";

/** A field the import would replace: the passage that differs, before and after. */
export interface TextChange {
  field: "notes" | "tldr";
  from: string;
  to: string;
}

const PARAGRAPH_BREAK = /\n{2,}/;
const PARAGRAPH_JOIN = "\n\n";

/**
 * The passage that differs between two Markdown texts: their paragraphs once
 * the ones both start and end with are set aside.
 */
export function changedPassage(from: string, to: string) {
  const before = from.split(PARAGRAPH_BREAK);
  const after = to.split(PARAGRAPH_BREAK);
  let start = 0;
  while (
    start < Math.min(before.length, after.length) &&
    before[start] === after[start]
  ) {
    start += 1;
  }
  let end = 0;
  while (
    end < Math.min(before.length, after.length) - start &&
    before.at(-1 - end) === after.at(-1 - end)
  ) {
    end += 1;
  }
  return {
    from: before.slice(start, before.length - end).join(PARAGRAPH_JOIN),
    to: after.slice(start, after.length - end).join(PARAGRAPH_JOIN),
  };
}

export interface DocsImportEntry {
  /** What the import would replace; only for `changed`. */
  changes: TextChange[];
  day: string;
  heading: string;
  notes: string | null;
  /** Why the entry is left out; only for `skipped`. */
  reason: string | null;
  scheduleId: number | null;
  status: DocsImportStatus;
  takeawayId: number | null;
  tldr: string | null;
}

/** Why a dated entry can't be matched to exactly one takeaway slot, or null. */
function skipReason(
  notes: SourceEntry | undefined,
  gatherings: DocsSchedule[],
  takeaways: StoredTakeaway[]
) {
  if (!notes) {
    return "A TL;DR without notes";
  }
  if (gatherings.length === 0) {
    return "No gathering on this date";
  }
  if (gatherings.length > 1) {
    return `${gatherings.length} gatherings on this date`;
  }
  if (takeaways.length > 1) {
    return `The gathering has ${takeaways.length} takeaways`;
  }
  return null;
}

/** What the documents would replace in a stored takeaway; a missing TL;DR keeps the stored one. */
function textChanges(
  takeaway: StoredTakeaway,
  notes: string,
  tldr: string | null
): TextChange[] {
  const changes: TextChange[] = [];
  if (takeaway.keypoints !== notes) {
    changes.push({
      field: "notes",
      ...changedPassage(takeaway.keypoints, notes),
    });
  }
  if (tldr !== null && takeaway.tldr !== tldr) {
    changes.push({
      field: "tldr",
      ...changedPassage(takeaway.tldr ?? "", tldr),
    });
  }
  return changes;
}

/**
 * Pairs the notes and TL;DR documents by date and compares each date with the
 * gathering held that day in Aachen and its takeaway. Dates are never guessed:
 * one without exactly one gathering is skipped. A TL;DR missing from its
 * document keeps the stored one. Published takeaways are never changed; they
 * count as unchanged when they still read like the documents.
 */
export function planDocsImport(
  notes: TakeawaySource,
  tldr: TakeawaySource,
  schedules: DocsSchedule[],
  existing: StoredTakeaway[]
): DocsImportEntry[] {
  const notesOn = new Map(notes.entries.map((entry) => [entry.date, entry]));
  const tldrOn = new Map(tldr.entries.map((entry) => [entry.date, entry]));
  const days = [...new Set([...notesOn.keys(), ...tldrOn.keys()])].sort();
  return days.map((day): DocsImportEntry => {
    const note = notesOn.get(day);
    const summary = tldrOn.get(day);
    const gatherings = schedules.filter((schedule) => schedule.day === day);
    const [gathering] = gatherings;
    const takeaways = existing.filter(
      (row) => row.scheduleId === gathering?.id
    );
    const base = {
      changes: [],
      day,
      heading: note?.heading ?? summary?.heading ?? day,
      notes: note?.content ?? null,
      reason: null,
      scheduleId: gathering?.id ?? null,
      takeawayId: null,
      tldr: summary?.content ?? null,
    };
    const reason = skipReason(note, gatherings, takeaways);
    if (reason) {
      return { ...base, reason, status: "skipped" };
    }
    const [takeaway] = takeaways;
    if (!takeaway) {
      return { ...base, status: "new" };
    }
    const changes = textChanges(takeaway, base.notes ?? "", base.tldr);
    let status: DocsImportStatus = "changed";
    if (changes.length === 0) {
      status = "unchanged";
    } else if (takeaway.status === "published") {
      status = "published";
    }
    return {
      ...base,
      changes: status === "changed" ? changes : [],
      status,
      takeawayId: takeaway.id,
    };
  });
}
