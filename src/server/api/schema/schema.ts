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

export const updateTakeawaySchema = addTakeawaySchema.extend({
  id: z.number(),
});

export const addScheduleSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters." })
    .max(50),
  date: z.date({
    required_error: "A date of service is required.",
  }),
  speaker: z.string({
    required_error: "Please select a speaker for the service.",
  }),
  bibleVerse: z.string().min(2).max(50),
  summary: z.string().min(10),
  liturgos: z.string().min(2).max(50).optional(),
  musician: z.string().min(2).max(50).optional(),
  multimedia: z.string().min(2).max(50).optional(),
  accommodation: z.string().min(2).max(50).optional(),
  cookingGroup: z.string().min(2).max(50).optional(),
  cleaningGroup: z.string().min(2).max(50),
});

export const updateScheduleSchema = addScheduleSchema.extend({
  id: z.number(),
});

export const addPrayerSchema = z.object({
  name: z.string().optional(),
  content: z.string().min(2).max(50),
  isAnonymous: z.boolean(),
  prayerNames: z.array(z.string()),
});

export const editPrayerSchema = addPrayerSchema.extend({ id: z.number() });

export const addPrayerCountSchema = z.object({
  id: z.number(),
  count: z.number(),
  prayerNames: z.array(z.string()),
});

export const queryByIdSchema = z.object({
  id: z.number(),
});
