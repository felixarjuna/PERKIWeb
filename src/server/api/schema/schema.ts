import { type RouterOutputs } from "@/server/index";
import { z } from "zod";

export const addTakeawaySchema = z.object({
  takeawayId: z.string(),
  title: z.string(),
  date: z.date(),
  speaker: z.string(),
  bibleVerse: z.string(),
  summary: z.string(),
  contributorId: z.number(),
});

export const addScheduleSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }).max(50),
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

export type Prayer = RouterOutputs["prayers"]["getPrayers"][number];
export type Takeaway = RouterOutputs["takeaways"]["getTakeaways"][number];

const prayerSchema = z
  .object({
    prayers: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    ),
  })
  .and(
    z.object({
      id: z.bigint(),
      name: z.string().nullable(),
      content: z.string(),
      count: z.number(),
    })
  );

const takeawaySchema = z
  .object({
    contributors: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    ),
  })
  .and(
    z.object({
      id: z.bigint(),
      takeawayId: z.string(),
      title: z.string(),
      date: z.date(),
      speaker: z.string(),
      bibleVerse: z.string(),
      summary: z.string(),
    })
  );

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  prayersPrayed: z.array(prayerSchema),
  takeaways: z.array(takeawaySchema),
});

export const addPrayerSchema = z.object({
  name: z.string().optional(),
  content: z.string().min(2).max(50),
  count: z.number().optional().default(0),
  prayerId: z.number(),
});

export const addPrayerCountSchema = z.object({
  id: z.number(),
  count: z.number(),
  prayerId: z.number(),
});
