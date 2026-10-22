import { markdownToPlainText } from "~/lib/markdown";

const SPACES = /\s+/;

/**
 * Adults read English non-fiction at ~238 words a minute (Brysbaert 2019).
 * Notes are mostly Indonesian, whose affixed words run longer, and are read
 * on phones, so estimate a little slower.
 */
const WORDS_PER_MINUTE = 200;

/** Estimated reading time of a takeaway, in whole minutes, at least 1. */
export function readingMinutes(markdown: string) {
  const words = markdownToPlainText(markdown)
    .split(SPACES)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
