"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { MarkdownEditor } from "~/components/markdown-editor";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TLDR_WORD_HINT, tldrWords } from "~/lib/takeaway-tldr";
import { cn } from "~/lib/utils";

const LABEL_ID = "tldr-label";

/** How long the TL;DR is against the hint; past it, the count stands out. */
function WordCount({ markdown }: { readonly markdown: string }) {
  const words = tldrWords(markdown);
  return (
    <span
      className={cn(
        "tabular-nums",
        words > TLDR_WORD_HINT ? "text-destructive-text" : undefined
      )}
      data-slot="tldr-word-count"
    >
      {words} / about {TLDR_WORD_HINT} words
    </span>
  );
}

/**
 * The takeaway's TL;DR, written beside its notes in the same editor; it is
 * reviewed and published with them. Shared by add and edit.
 */
export function TldrField<T extends FieldValues>({
  control,
  name,
}: {
  readonly control: Control<T>;
  readonly name: Path<T>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel id={LABEL_ID}>TL;DR</FormLabel>
          <FormDescription className="type-caption flex flex-wrap justify-between gap-x-3">
            <span>
              A few sentences for the Monday broadcast and social posts.
            </span>
            <WordCount markdown={field.value ?? ""} />
          </FormDescription>
          <FormControl>
            <MarkdownEditor
              aria-labelledby={LABEL_ID}
              disabled={field.disabled}
              onBlur={field.onBlur}
              onChange={field.onChange}
              ref={field.ref}
              toolbarLabel="TL;DR styling"
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
