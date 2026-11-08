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

const CHIP =
  "type-caption inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground";

/** A book's language: its flag (hidden from screen readers) and its name. */
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
    <span className={cn(CHIP, className)}>
      {label.code ? <Flag code={label.code} /> : null}
      {label.name}
    </span>
  );
}

/**
 * Author, then chips for the language, publisher and category the book has
 * (#147). An ebook says so in its state badge.
 */
export function BookByline({
  author,
  language,
  publisher = null,
  category = null,
}: {
  author: string;
  language: string | null;
  publisher?: string | null;
  category?: string | null;
}) {
  return (
    <p className="type-body-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
      <span>{author}</span>
      <LanguageChip language={language} />
      {publisher ? (
        <span className={CHIP}>
          <span className="sr-only">Publisher: </span>
          {publisher}
        </span>
      ) : null}
      {category ? (
        <span className={CHIP}>
          <span className="sr-only">Category: </span>
          {category}
        </span>
      ) : null}
    </p>
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
