import { MarkdownManager } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import type { Nodes } from "mdast";
import { parseMarkdown, tidyMarkdown } from "./markdown";

/**
 * The takeaway editor's schema. Markdown has no underline, so it is off;
 * headings keep every level so pasted Markdown never loses one.
 */
export const editorExtensions = [
  StarterKit.configure({
    link: { autolink: true, defaultProtocol: "https", openOnClick: false },
    underline: false,
  }),
];

let manager: MarkdownManager | undefined;

/** Markdown → editor document → Markdown, as saving an untouched takeaway does. */
export function editorRoundTrip(markdown: string) {
  manager ??= new MarkdownManager({ extensions: editorExtensions });
  return manager.serialize(manager.parse(tidyMarkdown(markdown)));
}

type Shape = { type: string; value?: string } & Record<string, unknown>;

/** Adjacent text, as raw HTML shown as text next to text reads. */
function mergeText(nodes: Shape[]) {
  const merged: Shape[] = [];
  for (const node of nodes) {
    const last = merged.at(-1);
    if (last?.type === "text" && node.type === "text") {
      merged[merged.length - 1] = {
        ...last,
        value: `${last.value}${node.value}`,
      };
    } else {
      merged.push(node);
    }
  }
  return merged;
}

/**
 * What a reader sees of a node: no source position or list `spread` (the
 * renderer spaces tight and loose lists alike; the editor writes them
 * tight), and raw HTML as the text the renderer shows instead.
 */
function structure(node: Nodes): Shape {
  if (node.type === "html") {
    return { type: "text", value: node.value };
  }
  const { position: _position, ...rest } = node;
  if ("spread" in rest) {
    rest.spread = undefined;
  }
  return "children" in node
    ? { ...rest, children: mergeText(node.children.map(structure)) }
    : rest;
}

/**
 * Whether two Markdown texts render the same: escapes, `_` vs `*`, blank
 * lines, list spacing and escaped HTML may differ, what's shown may not.
 */
export function rendersTheSame(a: string, b: string) {
  return (
    JSON.stringify(structure(parseMarkdown(a))) ===
    JSON.stringify(structure(parseMarkdown(b)))
  );
}
