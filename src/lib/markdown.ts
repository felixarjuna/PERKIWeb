import type { Nodes, Root, RootContent } from "mdast";
import { toString as mdastText } from "mdast-util-to-string";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/**
 * Takeaways are Markdown, read with GitHub's flavour (lists, tables, links)
 * and with single line breaks kept, the way writers typed them before #35.
 * The renderer and every plain-text use parse with these same plugins.
 */
export const remarkPlugins = [remarkGfm, remarkBreaks];

const CARRIAGE_RETURN = /\r\n?/g;
/** A list marker followed by a run of spaces, as Word pastes "1.      Title". */
const PADDED_MARKER = /^([ \t]*(?:[-*+]|\d{1,9}[.)]))[ \t]{2,}(?=\S)/gm;
/** "a. Point" or "iv) Point": text in Markdown, a list item to Tiptap. */
const LETTER_MARKER =
  /^([ \t]*(?:[a-zA-Z]{1,2}|[ivxlcdmIVXLCDM]+))([.)])(?=[ \t])/gm;

let parser: ReturnType<typeof createParser> | undefined;
const createParser = () => unified().use(remarkParse).use(remarkPlugins);

/**
 * Takeaway text as the renderer and the editor read it. Older takeaways were
 * saved from Windows (\r\n) and pasted from Word, whose "1.      Title" would
 * be read as code (5+ spaces after a list marker); writers mean a list item.
 * Lettered points stay text, escaped so the editor's list parser (which also
 * reads "a." and "iv." as markers) leaves them as they render.
 */
export function tidyMarkdown(text: string) {
  return text
    .replace(CARRIAGE_RETURN, "\n")
    .replace(PADDED_MARKER, "$1 ")
    .replace(LETTER_MARKER, "$1\\$2");
}

export function parseMarkdown(markdown: string): Root {
  parser ??= createParser();
  return parser.runSync(parser.parse(tidyMarkdown(markdown))) as Root;
}

/** Blocks whose children are blocks again; their text is read per child. */
const CONTAINERS = new Set(["blockquote", "list", "listItem"]);

/** The text of a block, with line breaks kept as \n. */
export function blockText(node: Nodes): string {
  if (node.type === "break") {
    return "\n";
  }
  if ("children" in node) {
    return node.children.map((child) => blockText(child)).join("");
  }
  return mdastText(node);
}

function textBlocks(nodes: RootContent[]): string[] {
  return nodes.flatMap((node) =>
    CONTAINERS.has(node.type) && "children" in node
      ? textBlocks(node.children as RootContent[])
      : [blockText(node).trim()]
  );
}

/**
 * Plain text with the Markdown syntax removed: one line per paragraph,
 * heading or list item, inner line breaks kept. Used for the list preview,
 * reading time and the page description.
 */
export function markdownToPlainText(markdown: string) {
  return textBlocks(parseMarkdown(markdown).children)
    .filter(Boolean)
    .join("\n");
}
