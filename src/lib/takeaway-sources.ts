import { DateTime } from "luxon";
import { z } from "zod";

/**
 * A pair of documents "Import from Docs" reads: the notes document and an
 * optional TL;DR document, under a label staff pick (usually the year).
 * Stored together as one JSON array in the `takeaway_sources` setting.
 */
export const docsSourceSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(40),
  notesDocId: z.string().min(1),
  tldrDocId: z.string().min(1).nullable(),
});
export type DocsSource = z.infer<typeof docsSourceSchema>;

const docsSourcesSchema = z.array(docsSourceSchema);

/** The stored sources; a value that isn't a valid list reads as none. */
export function parseDocsSources(value: string | null | undefined) {
  if (!value) {
    return [];
  }
  try {
    const parsed = docsSourcesSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/**
 * The first source, built from the single notes/TL;DR pair Settings held
 * before sources existed, labelled with the current year in Aachen; null
 * when no notes document was set.
 */
export function carriedOverSource(
  legacy: { notesDocId?: string | null; tldrDocId?: string | null },
  id: string,
  now: Date
): DocsSource | null {
  if (!legacy.notesDocId) {
    return null;
  }
  return {
    id,
    label: String(DateTime.fromJSDate(now, { zone: "Europe/Berlin" }).year),
    notesDocId: legacy.notesDocId,
    tldrDocId: legacy.tldrDocId || null,
  };
}

const labelKey = (label: string) => label.trim().toLocaleLowerCase();

/** Whether another source (not `exceptId`) already uses this label. */
export const labelTaken = (
  sources: readonly DocsSource[],
  label: string,
  exceptId?: string
) =>
  sources.some(
    (source) =>
      source.id !== exceptId && labelKey(source.label) === labelKey(label)
  );

/**
 * The source the import picker starts on: the one used last, else the
 * newest added (the list keeps the order staff added them in).
 */
export function preselectedSource(
  sources: readonly DocsSource[],
  lastUsedId: string | null
) {
  return (
    sources.find((source) => source.id === lastUsedId)?.id ??
    sources.at(-1)?.id ??
    null
  );
}
