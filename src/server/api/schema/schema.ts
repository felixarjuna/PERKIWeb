import { z } from "zod";
import { ASSIGNABLE_ROLES } from "~/lib/roles";

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

/** Longest prayer request, in characters (shared with the prayer form). */
export const PRAYER_MAX_LENGTH = 280;

/** The author and their name come from the session, not from input. */
export const addPrayerSchema = z.object({
  content: z.string().min(2).max(PRAYER_MAX_LENGTH),
  isAnonymous: z.boolean(),
});

export const editPrayerSchema = addPrayerSchema.extend({
  id: z.number(),
});

export const queryByIdSchema = z.object({
  id: z.number(),
});

export const prayerVisibilitySchema = queryByIdSchema.extend({
  visibility: z.enum(["private", "published"]),
});
/** Whether the signed-in user is praying for published prayer `id`. */
export const prayerAcknowledgementSchema = queryByIdSchema.extend({
  pressed: z.boolean(),
});

export const addProfileSchema = z.object({
  address: z.string().trim().min(1, "Please enter your address."),
  bio: z.string().optional(),
  birthday: z.date({ error: "Please enter your date of birth." }),
  location: z.string().trim().min(1, "Please enter your location."),
  major: z.string().trim().min(1, "Please enter your major."),
  phoneNumber: z.string().trim().min(1, "Please enter your WhatsApp number."),
  userId: z.string().min(1),
});

export const setRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
  userId: z.string().min(1),
});

const SITE_PATH = /^\/[\w./-]+$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional();

/** A guest speaker as entered in the workspace. */
export const speakerInput = z.object({
  active: z.boolean().default(true),
  /** Other spellings, as typed; stored normalised. */
  aliases: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  favoriteVerse: optionalText(300),
  name: z.string().trim().min(2).max(100),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || SITE_PATH.test(value) || URL.canParse(value),
      {
        message:
          "Use a full link (https://…) or a site path like /images/john.jpg.",
      }
    )
    .transform((value) => value || null)
    .nullable()
    .optional(),
  story: optionalText(5000),
});
