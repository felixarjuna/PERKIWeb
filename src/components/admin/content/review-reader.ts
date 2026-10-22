import { TableKit } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Node as TiptapNode } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// GFM checkboxes are part of the passage, but can never be toggled in review.
const ReadOnlyCheckbox = TiptapNode.create({
  addAttributes: () => ({
    checked: {
      default: false,
      parseHTML: (element) => element.hasAttribute("checked"),
    },
  }),
  atom: true,
  group: "inline",
  inline: true,
  name: "readOnlyCheckbox",
  parseHTML: () => [{ tag: "input[type=checkbox]" }],
  renderHTML: ({ node }) => [
    "input",
    {
      "aria-label": "Task status",
      checked: node.attrs.checked ? "checked" : null,
      disabled: "disabled",
      type: "checkbox",
    },
  ],
  selectable: false,
});

export const reviewReaderExtensions = [
  StarterKit.configure({
    link: { HTMLAttributes: { rel: null, target: null }, openOnClick: true },
    underline: false,
  }),
  TableKit.configure({ table: { resizable: false } }),
  ReadOnlyCheckbox,
];

export function passageText(doc: ProseMirrorNode, from: number, to: number) {
  return doc
    .textBetween(from, to, "\n", (node) =>
      node.type.name === "hardBreak" ? "\n" : ""
    )
    .trim();
}
