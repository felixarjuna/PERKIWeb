import { countWords } from "~/lib/markdown";
import { cn } from "~/lib/utils";

/**
 * The word count under a Markdown editor, in its bottom-right corner. With a
 * `hint` it shows the count against it and stands out once past it.
 */
export function EditorWordCount({
  hint,
  markdown,
}: {
  readonly hint?: number;
  readonly markdown: string;
}) {
  const words = countWords(markdown);
  let label = `${words} ${words === 1 ? "word" : "words"}`;
  if (hint !== undefined) {
    label = `${words} / about ${hint} words`;
  }
  return (
    <p
      className={cn(
        "type-caption text-right text-muted-foreground tabular-nums",
        hint !== undefined && words > hint && "text-destructive-text"
      )}
      data-slot="editor-word-count"
    >
      {label}
    </p>
  );
}
