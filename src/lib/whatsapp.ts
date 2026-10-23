import type { List, PhrasingContent, RootContent } from "mdast";
import { toString as mdastText } from "mdast-util-to-string";
import { parseMarkdown } from "./markdown";

const LINE_START = /^/gm;

const wrap = (marker: string, text: string) =>
  text ? `${marker}${text}${marker}` : text;

const inline = (nodes: PhrasingContent[]): string =>
  nodes.map((node) => phrase(node)).join("");

function phrase(node: PhrasingContent): string {
  switch (node.type) {
    case "break":
      return "\n";
    case "strong":
      return wrap("*", inline(node.children));
    case "emphasis":
      return wrap("_", inline(node.children));
    case "delete":
      return wrap("~", inline(node.children));
    case "inlineCode":
      return wrap("`", node.value);
    case "link": {
      const text = inline(node.children);
      return text === node.url ? node.url : `${text} (${node.url})`;
    }
    default:
      return "children" in node ? inline(node.children) : mdastText(node);
  }
}

const listText = (list: List) =>
  list.children
    .map((item, index) => {
      const marker = list.ordered ? `${(list.start ?? 1) + index}. ` : "- ";
      const [first = "", ...rest] = item.children.map((child) => block(child));
      const nested = rest.map((text) => text.replace(LINE_START, "  "));
      return [`${marker}${first}`, ...nested].join("\n");
    })
    .join("\n");

function block(node: RootContent): string {
  switch (node.type) {
    case "heading":
      return wrap("*", inline(node.children));
    case "paragraph":
      return inline(node.children);
    case "list":
      return listText(node);
    case "blockquote":
      return blocks(node.children).replace(LINE_START, "> ");
    case "code":
      return `\`\`\`${node.value}\`\`\``;
    case "thematicBreak":
      return "";
    default:
      return mdastText(node);
  }
}

const blocks = (nodes: RootContent[]) =>
  nodes
    .map((node) => block(node).trim())
    .filter(Boolean)
    .join("\n\n");

/** A takeaway's Markdown in WhatsApp's own formatting, for pasting. */
export const markdownToWhatsApp = (markdown: string) =>
  blocks(parseMarkdown(markdown).children);

/** The Monday broadcast: the title, the TL;DR, then a link to the notes. */
export const whatsAppPost = ({
  title,
  tldr,
  url,
}: {
  title: string;
  tldr: string;
  url: string;
}) =>
  [
    wrap("*", title.trim()),
    markdownToWhatsApp(tldr),
    `Read the whole takeaway: ${url}`,
  ].join("\n\n");
