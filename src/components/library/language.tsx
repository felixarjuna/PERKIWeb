"use client";

import { AdminSelect } from "~/components/admin/admin-controls";
import {
  isLanguageCode,
  type LanguageCode,
  LIBRARY_LANGUAGES,
  languageLabel,
} from "~/lib/library";
import { cn } from "~/lib/utils";
import { Flag } from "./flag";

/**
 * A book's language: its flag (hidden from screen readers, the name carries
 * the meaning) and its name, inline, no pill.
 */
export function LanguageChip({
  language,
  className,
}: {
  language: string | null;
  className?: string;
}) {
  const label = languageLabel(language);
  if (!label) {
    return null;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="sr-only">Language: </span>
      {label.code ? <Flag code={label.code} /> : null}
      {label.name}
    </span>
  );
}

/**
 * The book's category as an eyebrow above its title, the way a catalogue
 * card names its shelf section (#147). Nothing when the book has none.
 */
export function BookCategory({ category }: { category: string | null }) {
  if (!category) {
    return null;
  }
  return (
    <p className="type-eyebrow mb-1 text-muted-foreground">
      <span className="sr-only">Category: </span>
      {category}
    </p>
  );
}

/**
 * The author on one line, then the language (flag and name) and publisher
 * as one quiet line of facts separated by a dot (#147). An ebook says so in
 * its state badge; a physical book says nothing about its format.
 */
export function BookByline({
  author,
  language,
  publisher = null,
}: {
  author: string;
  language: string | null;
  publisher?: string | null;
}) {
  const hasLanguage = languageLabel(language) !== null;
  return (
    <div className="mt-1">
      <p className="type-body-sm text-muted-foreground">{author}</p>
      {hasLanguage || publisher ? (
        <p className="type-caption mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <LanguageChip language={language} />
          {hasLanguage && publisher ? (
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
          ) : null}
          {publisher ? (
            <span>
              <span className="sr-only">Publisher: </span>
              {publisher}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/** Whether a stored language is one the picker can save. */
export const pickedLanguage = (value: string): LanguageCode | null | false => {
  if (value === "") {
    return null;
  }
  return isLanguageCode(value) ? value : false;
};

const OPTIONS = [
  { label: "No language", value: "" },
  ...LIBRARY_LANGUAGES.map((language) => ({
    label: language.name,
    prefix: <Flag code={language.code} />,
    value: language.code,
  })),
];

/**
 * Picks a book's language from the list, or none. A value typed before the
 * list stays shown as it was until someone picks one; the form must not save
 * it as it is (`pickedLanguage` returns false).
 */
export function LanguagePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  /** A code, "" for none, or an older free-text value. */
  value: string;
  onChange: (value: string) => void;
}) {
  const unknown = pickedLanguage(value) === false;
  const hintId = `${id}-hint`;
  return (
    <div className="grid gap-2">
      <AdminSelect
        describedBy={hintId}
        formLabel
        id={id}
        label="Language"
        onChange={onChange}
        options={unknown ? [...OPTIONS, { label: value, value }] : OPTIONS}
        value={value}
      />
      <p
        className={cn(
          "type-caption",
          unknown ? "text-destructive-text" : "text-muted-foreground"
        )}
        id={hintId}
      >
        {unknown
          ? `“${value}” isn't on the list. Pick its language to save.`
          : "Optional."}
      </p>
    </div>
  );
}
