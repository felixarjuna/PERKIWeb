import { z } from "zod";

export const addTakeawaySchema = z.object({
  contributors: z.array(z.string()),
  keypoints: z.string(),
  scheduleId: z.number(),
});

export const updateTakeawaySchema = addTakeawaySchema.extend({
  id: z.number(),
});

export const addScheduleSchema = z.object({
  accommodation: z.string().optional(),
  bibleVerse: z.string().min(2).max(50),
  cleaningGroup: z.string().min(2).max(50),
  cookingGroup: z.string().optional(),
  date: z.date({
    error: "A date of service is required.",
  }),
  description: z.string().min(2, {
    message: "An event must have a description with at least 2 characters.",
  }),
  leader: z.string().min(2).max(50),
  multimedia: z.string().optional(),
  musician: z.string().min(2).max(50),
  noteWriter: z.string().min(2).max(50),
  preacher: z
    .string({
      error: "Please select the speaker for the service.",
    })
    .optional(),
  title: z
    .string()
    .min(2, {
      message: "An event must have a title with at least 2 characters.",
    })
    .max(50),
  type: z.enum(["church_service", "bible_study"]),
});

export const addScheduleBatchSchema = z.array(addScheduleSchema);

export const updateScheduleSchema = addScheduleSchema.extend({
  id: z.number(),
});

export const addPrayerSchema = z.object({
  content: z.string().min(2).max(50),
  isAnonymous: z.boolean(),
  name: z.string().optional(),
  prayerNames: z.array(z.string()),
});

export const editPrayerSchema = addPrayerSchema.extend({
  id: z.number(),
});

export const addPrayerCountSchema = z.object({
  count: z.number(),
  id: z.number(),
  prayerNames: z.array(z.string()),
});

export const queryByIdSchema = z.object({
  id: z.number(),
});

export const addProfileSchema = z.object({
  address: z.string(),
  bio: z.string().optional(),
  birthday: z.date(),
  location: z.string(),
  major: z.string(),
  phoneNumber: z.string(),
  userId: z.string(),
});
