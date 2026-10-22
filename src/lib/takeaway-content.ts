import type { Nodes } from "mdast";
import { z } from "zod";
import { blockText, parseMarkdown } from "./markdown";

/** Only text readers can see counts; formatting and omitted images do not. */
const hasText = (node: Nodes): boolean => {
  if (
    node.type === "image" ||
    node.type === "imageReference" ||
    node.type === "footnoteDefinition"
  ) {
    return false;
  }
  if (node.type === "footnoteReference") {
    return true;
  }
  if ("children" in node) {
    return node.children.some(hasText);
  }
  return blockText(node).trim().length > 0;
};

export const takeawayKeypointsSchema = z
  .string()
  .refine(
    (value) => hasText(parseMarkdown(value)),
    "Write some key points before saving or sending to review."
  );
