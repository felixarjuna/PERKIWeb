import type { Nodes } from "mdast";
import { blockText, parseMarkdown } from "./markdown";

/**
 * Takeaways were plain text until #35. This is how the page showed them
 * then (#34), kept so `scripts/takeaway-markdown-check.ts` can list the ones
 * that read differently as Markdown.
 */

const BLANK_LINE = /\n\s*\n/;
const CARRIAGE_RETURN = /\r\n?/g;
/** Longest first line still read as a section title, e.g. "1. Integritas Nuh". */
const HEADING_MAX_LENGTH = 60;
/** A first line ending like a sentence or clause is prose, not a title. */
const ENDS_LIKE_PROSE = /[.,;:!?…)\]"”'’-]$/;
/** Writers sometimes type "1.  Title"; titles collapse runs of spaces. */
const SPACES = /\s+/g;
/** Titles and the sentence under them start with a capital or a number. */
const STARTS_UPPER = /^[\p{Lu}\d]/u;
const TRAILING_SPACES = /[ \t]+$/gm;

/** Splits plain text into paragraphs at blank lines. */
export function paragraphs(text: string) {
  return text
    .replace(CARRIAGE_RETURN, "\n")
    .split(BLANK_LINE)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/**
 * Paragraphs, with a writer's own section title split off: a short first line
 * that doesn't end like a sentence, followed by a line starting a new sentence.
 */
export function sections(text: string) {
  return paragraphs(text).map((paragraph) => {
    const [first = "", ...rest] = paragraph.split("\n");
    const title = first.trim().replace(SPACES, " ");
    const isHeading =
      rest.length > 0 &&
      title.length <= HEADING_MAX_LENGTH &&
      STARTS_UPPER.test(title) &&
      STARTS_UPPER.test(rest[0]?.trim() ?? "") &&
      !ENDS_LIKE_PROSE.test(title);
    return isHeading
      ? { body: rest.join("\n").trim(), heading: title }
      : { body: paragraph, heading: null };
  });
}

/** What a reader would notice, by Markdown node type. */
const FEATURE_NAMES: Partial<Record<string, string>> = {
  blockquote: "quote",
  code: "code block",
  delete: "strikethrough",
  emphasis: "emphasis",
  footnoteReference: "footnote",
  heading: "heading",
  html: "HTML",
  image: "image",
  inlineCode: "inline code",
  link: "link",
  strong: "bold",
  table: "table",
  thematicBreak: "horizontal rule",
};

function nodeName(node: Nodes) {
  if (node.type === "list") {
    return node.ordered ? "numbered list" : "bullet list";
  }
  return FEATURE_NAMES[node.type];
}

/** Every Markdown feature used below a node, e.g. code inside a list item. */
function featureNames(node: Nodes): string[] {
  const name = nodeName(node);
  const inner =
    "children" in node
      ? node.children.flatMap((child) => featureNames(child))
      : [];
  return name ? [name, ...inner] : inner;
}

/**
 * How a plain-text takeaway reads differently once rendered as Markdown,
 * e.g. ["section title", "numbered list"]; empty when it reads the same.
 */
export function markdownChanges(text: string) {
  const changes = new Set<string>();
  if (sections(text).some((section) => section.heading)) {
    changes.add("section title");
  }
  const root = parseMarkdown(text);
  for (const name of featureNames(root)) {
    changes.add(name);
  }
  const blocks = root.children;
  const before = paragraphs(text).map((paragraph) =>
    paragraph.replace(TRAILING_SPACES, "")
  );
  const after = blocks.map((block) => blockText(block).trim());
  if (changes.size === 0 && before.join("\n\n") !== after.join("\n\n")) {
    changes.add("text");
  }
  return [...changes];
}
