import { z } from "zod";

/** About what fits a broadcast message or a post caption. */
export const TLDR_WORD_HINT = 80;
export const TLDR_MAX_LENGTH = 2000;

/** A TL;DR as stored: the Markdown as written, or null when it is empty. */
export const normalizeTldr = (markdown: string) => markdown.trim() || null;

export const takeawayTldrSchema = z
  .string()
  .max(TLDR_MAX_LENGTH, `Keep the TL;DR under ${TLDR_MAX_LENGTH} characters.`);
