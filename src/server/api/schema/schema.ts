import { z } from "zod";

export const addTakeawaySchema = z.object({
  scheduleId: z.number(),
  keypoints: z.string(),
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
  description: z.string().min(10),
  date: z.date({
    required_error: "A date of service is required.",
  }),
  bibleVerse: z.string().min(2).max(50),
  type: z.enum(["church_service", "bible_study"]),
  preacher: z
    .string({
      required_error: "Please select the speaker for the service.",
    })
    .optional(),
  leader: z.string().min(2).max(50),
  musician: z.string().min(2).max(50),
  multimedia: z.string().min(2).max(50).optional(),
  accommodation: z.string().min(2).max(50).optional(),
  noteWriter: z.string().min(2).max(50),
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
