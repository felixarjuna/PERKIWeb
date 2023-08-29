import { z } from "zod";

export const addTakeawaySchema = z.object({
  takeawayId: z.string(),
  title: z.string(),
  date: z.date(),
  speaker: z.string(),
  bibleVerse: z.string(),
  summary: z.string(),
  contributors: z.array(z.string()),
});

export const addTakeawaySchemaBackend = addTakeawaySchema.extend({ date: z.string() });

export const addScheduleSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }).max(50),
  date: z.date({
    required_error: "A date of service is required.",
  }),
  speaker: z.string({
    required_error: "Please select a speaker for the service.",
  }),
  bibleVerse: z.string().min(2).max(50),
  summary: z.string().min(2).max(50),
  liturgos: z.string().min(2).max(50).optional(),
  musician: z.string().min(2).max(50).optional(),
  multimedia: z.string().min(2).max(50).optional(),
  accommodation: z.string().min(2).max(50).optional(),
  cookingGroup: z.string().min(2).max(50).optional(),
  cleaningGroup: z.string().min(2).max(50),
});

export const addScheduleSchemaBackend = addScheduleSchema.extend({ date: z.string() });

export const addPrayerSchema = z.object({
  name: z.string().optional(),
  content: z.string().min(2).max(50),
});
