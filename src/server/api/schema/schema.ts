import { z } from "zod";
import { REQUESTABLE_ROLES } from "~/lib/access";
import { eventTypeEnum, TAKEAWAY_STATUSES } from "~/lib/db/schema/schema";
import { ASSIGNABLE_ROLES } from "~/lib/roles";
import { takeawayKeypointsSchema } from "~/lib/takeaway-content";

const takeawayFieldsSchema = z.object({
  contributors: z.array(z.string()),
  keypoints: takeawayKeypointsSchema,
  scheduleId: z.number(),
});

/** New takeaways start as a draft or go straight to review; staff publish later. */
export const addTakeawaySchema = takeawayFieldsSchema.extend({
  status: z.enum(["draft", "in_review"]).default("draft"),
});

/** Editing the text never changes the status; `setStatus` does. */
export const updateTakeawaySchema = takeawayFieldsSchema.extend({
  id: z.number(),
});

export const takeawayStatusSchema = z.object({
  id: z.number(),
  status: z.enum(TAKEAWAY_STATUSES),
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

const profileText = z.string().trim().max(200);

/** The caller's own member details; omitted fields stay as they are. */
export const saveProfileSchema = z.object({
  address: profileText.optional(),
  birthday: z.date().nullable().optional(),
  location: profileText.optional(),
  major: profileText.optional(),
  nickname: z.string().trim().max(50).optional(),
  phoneNumber: profileText.optional(),
});
export type SaveProfileInput = z.infer<typeof saveProfileSchema>;

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

/** Most items one page of a list may hold. */
export const MAX_PAGE_SIZE = 50;

/** Where the next page starts: the last item's date and id. */
const cursorSchema = z
  .object({ date: z.date(), id: z.number().int() })
  .nullish();

/**
 * One page of a list, filtered by words, gathering type and an optional date
 * window: gatherings from `from` (inclusive) and/or before `before`.
 */
const pageSchema = z.object({
  before: z.date().optional(),
  cursor: cursorSchema,
  from: z.date().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(10),
  /** Every word must appear somewhere in the searched fields. */
  q: z.string().trim().max(200).default(""),
  type: z.enum([...eventTypeEnum.enumValues, "all"]).default("all"),
});

const orderSchema = z.enum(["asc", "desc"]).default("desc");

export const scheduleListSchema = pageSchema.extend({
  order: orderSchema,
});

/** Every schedule from `from` (inclusive) to `before` (exclusive), earliest first. */
export const scheduleRangeSchema = z.object({
  before: z.date().optional(),
  from: z.date(),
});

export const takeawayListSchema = pageSchema;

export const manageableTakeawaySchema = pageSchema.extend({
  order: orderSchema,
  status: z.enum([...TAKEAWAY_STATUSES, "all"]).default("all"),
});

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const accessRequestSchema = z.object({
  role: z.enum(REQUESTABLE_ROLES),
});

export const decideRequestSchema = z.object({
  approve: z.boolean(),
  id: z.number().int(),
});
