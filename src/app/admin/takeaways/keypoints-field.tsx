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

const LABEL_ID = "keypoints-label";

/** The takeaway's notes, written in the Markdown editor; shared by add and edit. */
export function KeypointsField<T extends FieldValues>({
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
          <FormLabel id={LABEL_ID}>Key points</FormLabel>
          <FormDescription className="type-caption">
            Use the toolbar for headings, bold, lists, quotes and links. Readers
            see the note as it looks here.
          </FormDescription>
          <FormControl>
            <MarkdownEditor
              aria-labelledby={LABEL_ID}
              disabled={field.disabled}
              onBlur={field.onBlur}
              onChange={field.onChange}
              ref={field.ref}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
