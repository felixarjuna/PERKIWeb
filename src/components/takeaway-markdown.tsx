import { type ComponentProps, createElement } from "react";
import Markdown, { type Components } from "react-markdown";
import { remarkPlugins, tidyMarkdown } from "~/lib/markdown";
import { cn } from "~/lib/utils";

const EXTERNAL = /^https?:\/\//i;

/** react-markdown passes its syntax-tree `node`; it never reaches the DOM. */
interface MarkdownProps {
  readonly node?: unknown;
}

/** Renders a Markdown element as another tag, e.g. every h1 as an h2. */
const as =
  (tag: string) =>
  ({ node: _node, ...props }: MarkdownProps) =>
    createElement(tag, props);

/**
 * Links leave the site in a new tab without handing it this page. Unsafe
 * protocols (javascript:, data:) were already emptied by react-markdown.
 */
function MarkdownLink({
  node: _node,
  ...props
}: ComponentProps<"a"> & MarkdownProps) {
  const external = props.href ? EXTERNAL.test(props.href) : false;
  return (
    <a
      {...props}
      {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
    />
  );
}

/** The page's title is its h1, so a note's headings are h2 and h3. */
const components: Components = {
  a: MarkdownLink,
  h1: as("h2"),
  h4: as("h3"),
  h5: as("h3"),
  h6: as("h3"),
};

/**
 * Renders a takeaway's Markdown, styled by `.takeaway-prose` (globals.css).
 * Raw HTML is shown as text, never as markup, and images are left out:
 * notes are words, and an image URL could track readers.
 */
export function TakeawayMarkdown({
  className,
  markdown,
}: {
  readonly className?: string;
  readonly markdown: string;
}) {
  return (
    <div className={cn("takeaway-prose", className)}>
      <Markdown
        components={components}
        disallowedElements={["img"]}
        remarkPlugins={remarkPlugins}
      >
        {tidyMarkdown(markdown)}
      </Markdown>
    </div>
  );
}
