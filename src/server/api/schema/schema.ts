import { z } from "zod";

export const takeawaySchema = z.object({
  title: z.string(),
  date: z.date(),
  speaker: z.string(),
  bibleVerse: z.string(),
  summary: z.string(),
  contributors: z.array(z.string()),
});
