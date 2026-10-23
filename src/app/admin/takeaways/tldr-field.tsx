"use client";

import type { Control, FieldValues, Path } from "react-hook-form";
import { EditorWordCount } from "~/components/editor-word-count";
import { MarkdownEditor } from "~/components/markdown-editor";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { TLDR_WORD_HINT } from "~/lib/takeaway-tldr";

const LABEL_ID = "tldr-label";

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
          <FormDescription className="type-caption">
            A few sentences for the Monday broadcast and social posts.
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
          <EditorWordCount hint={TLDR_WORD_HINT} markdown={field.value ?? ""} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
