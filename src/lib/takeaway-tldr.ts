import { z } from "zod";
import { markdownToPlainText } from "./markdown";

/** About what fits a broadcast message or a post caption. */
export const TLDR_WORD_HINT = 80;
export const TLDR_MAX_LENGTH = 2000;

const WORD = /\S+/g;

/** Words a reader sees: Markdown marks don't count. */
export const tldrWords = (markdown: string) =>
  markdownToPlainText(markdown).match(WORD)?.length ?? 0;

/** A TL;DR as stored: the Markdown as written, or null when it is empty. */
export const normalizeTldr = (markdown: string) => markdown.trim() || null;

export const takeawayTldrSchema = z
  .string()
  .max(TLDR_MAX_LENGTH, `Keep the TL;DR under ${TLDR_MAX_LENGTH} characters.`);
