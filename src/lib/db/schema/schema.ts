import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import type { AdapterAccount } from "next-auth/adapters";
import { z } from "zod";
import { SERVING_ROLES } from "../../serving-roles";

export const eventTypeEnum = pgEnum("event_type", [
  "church_service",
  "bible_study",
]);
const eventEnum = z.enum(eventTypeEnum.enumValues);

export type EventTypeEnum = z.infer<typeof eventEnum>;

export type NewSchedule = typeof schedules.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export const schedules = pgTable("schedules", {
  accommodation: text("accommodation"),
  bibleVerse: text("bibleVerse").notNull(),
  cleaningGroup: text("cleaningGroup").notNull(),
  cookingGroup: text("cookingGroup"),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  date: timestamp("date", { mode: "date", withTimezone: true }).notNull(),
  description: text("description").notNull(),
  id: serial("id").primaryKey().notNull(),
  leader: text("leader").notNull(),
  multimedia: text("multimedia"),
  musician: text("musician").notNull(),
  noteWriter: text("noteWriter").notNull(),
  preacher: text("preacher"),
  title: text("title").notNull(),
  type: eventTypeEnum("type").notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const TAKEAWAY_STATUSES = ["draft", "in_review", "published"] as const;
export type TakeawayStatus = (typeof TAKEAWAY_STATUSES)[number];

export const takeaways = pgTable(
  "takeaways",
  {
    /** Who wrote the takeaway; null for takeaways created before authorship. */
    authorId: text("authorId").references(() => users.id, {
      onDelete: "set null",
    }),
    contributors: json("contributors").notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    id: serial("id").primaryKey().notNull(),
    keypoints: text("keypoints").notNull(),
    /** When the takeaway was (last) published; null while it is not. */
    publishedAt: timestamp("publishedAt", {
      mode: "date",
      withTimezone: true,
    }),
    /** Who published it; null while it is not published. */
    publishedById: text("publishedById").references(() => users.id, {
      onDelete: "set null",
    }),
    scheduleId: integer("scheduleId")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    /**
     * draft → in_review → published. The database default is `published` so
     * the release before #56 (which never sets it) keeps publishing as it
     * did; the app always sets the status explicitly.
     */
    status: text("status", { enum: TAKEAWAY_STATUSES })
      .default("published")
      .notNull(),
    /** Short broadcast summary; null for older takeaways without one. */
    tldr: text("tldr"),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "takeaways_status_check",
      sql`${t.status} in ('draft', 'in_review', 'published')`
    ),
  ]
);

export const REVISION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "discarded",
] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

/**
 * A correction to a published takeaway (#74). The website keeps showing the
 * takeaway's own text while its open revision (draft or in review) is worked
 * on; publishing copies the revision onto the takeaway. Published and
 * discarded revisions stay as the takeaway's version history. Never returned
 * by the public takeaway queries.
 */
export const takeawayRevisions = pgTable(
  "takeaway_revisions",
  {
    /** Who started the correction; null once their account is deleted. */
    authorId: text("authorId").references(() => users.id, {
      onDelete: "set null",
    }),
    contributors: json("contributors").notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    /** When it was published or discarded; null while it is open. */
    decidedAt: timestamp("decidedAt", {
      mode: "date",
      withTimezone: true,
    }),
    decidedById: text("decidedById").references(() => users.id, {
      onDelete: "set null",
    }),
    id: serial("id").primaryKey().notNull(),
    keypoints: text("keypoints").notNull(),
    /** The live notes this revision replaced, set when it is published. */
    previousKeypoints: text("previousKeypoints"),
    previousTldr: text("previousTldr"),
    status: text("status", { enum: REVISION_STATUSES })
      .default("draft")
      .notNull(),
    takeawayId: integer("takeawayId")
      .notNull()
      .references(() => takeaways.id, { onDelete: "cascade" }),
    tldr: text("tldr"),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("takeaway_revisions_takeaway_idx").on(t.takeawayId),
    // One correction at a time per takeaway.
    uniqueIndex("takeaway_revisions_open")
      .on(t.takeawayId)
      .where(sql`${t.status} in ('draft', 'in_review')`),
    check(
      "takeaway_revisions_status_check",
      sql`${t.status} in ('draft', 'in_review', 'published', 'discarded')`
    ),
  ]
);

/**
 * The review thread on a takeaway (#57): internal to writers and staff, never
 * returned by the public takeaway queries.
 */
export const takeawayComments = pgTable(
  "takeaway_comments",
  {
    /** Who wrote the comment; null once their account is deleted. */
    authorId: text("authorId").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    id: serial("id").primaryKey().notNull(),
    /** The passage of the notes the comment is about, if any. */
    quote: text("quote"),
    /**
     * Mita's note when sending a submitted takeaway back to draft (#75): shown
     * to the writer above the text until they resolve it.
     */
    requestsChanges: boolean("requestsChanges").default(false).notNull(),
    /** When the comment was resolved; null while it is open. */
    resolvedAt: timestamp("resolvedAt", {
      mode: "date",
      withTimezone: true,
    }),
    resolvedById: text("resolvedById").references(() => users.id, {
      onDelete: "set null",
    }),
    /** The correction the comment was made on (#74); null for the takeaway's own review. */
    revisionId: integer("revisionId").references(() => takeawayRevisions.id, {
      onDelete: "set null",
    }),
    takeawayId: integer("takeawayId")
      .notNull()
      .references(() => takeaways.id, { onDelete: "cascade" }),
  },
  (t) => [index("takeaway_comments_takeaway_idx").on(t.takeawayId)]
);

export const SUGGESTION_STATUSES = ["open", "accepted", "rejected"] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

/** Replacement text a reviewer proposes for a passage of the notes (#58). */
export const takeawaySuggestions = pgTable(
  "takeaway_suggestions",
  {
    /** Who suggested the edit; null once their account is deleted. */
    authorId: text("authorId").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    /** When it was accepted or rejected; null while it is open. */
    decidedAt: timestamp("decidedAt", {
      mode: "date",
      withTimezone: true,
    }),
    decidedById: text("decidedById").references(() => users.id, {
      onDelete: "set null",
    }),
    id: serial("id").primaryKey().notNull(),
    /** The passage as the reviewer selected it, in plain text. */
    original: text("original").notNull(),
    replacement: text("replacement").notNull(),
    /** The correction it was suggested on (#74); its text is what it replaces. */
    revisionId: integer("revisionId").references(() => takeawayRevisions.id, {
      onDelete: "set null",
    }),
    status: text("status", { enum: SUGGESTION_STATUSES })
      .default("open")
      .notNull(),
    takeawayId: integer("takeawayId")
      .notNull()
      .references(() => takeaways.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("takeaway_suggestions_takeaway_idx").on(t.takeawayId),
    check(
      "takeaway_suggestions_status_check",
      sql`${t.status} in ('open', 'accepted', 'rejected')`
    ),
  ]
);

export const prayers = pgTable("prayers", {
  /** Who submitted the prayer; null for prayers created before authorship. */
  authorId: text("authorId").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  id: serial("id").primaryKey().notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  name: text("name"),
  prayerNames: json("prayerNames").notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
  visibility: text("visibility", { enum: ["private", "published"] })
    .default("private")
    .notNull(),
});

export const users = pgTable(
  "user",
  {
    createdAt: timestamp("createdAt", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", {
      mode: "date",
    }),
    hashedPassword: text("hashedPassword"),
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    image: text("image"),
    name: text("name"),
    /** owner | mita | writer | member; legacy `admin` is read as mita. */
    role: text("role").default("member").notNull(),
    updatedAt: timestamp("updatedAt", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .$onUpdate(() => new Date()),
    /** When the profile welcome step was saved or skipped; null = not yet. */
    welcomeSeenAt: timestamp("welcomeSeenAt", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (t) => [
    check(
      "user_role_check",
      sql`${t.role} in ('owner', 'mita', 'writer', 'member', 'admin')`
    ),
    uniqueIndex("user_single_owner").on(t.role).where(sql`${t.role} = 'owner'`),
  ]
);

export const roleChanges = pgTable("role_changes", {
  changedById: text("changedById").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  fromRole: text("fromRole").notNull(),
  id: serial("id").primaryKey().notNull(),
  /** How the change came about: `invite`, `request`, or null (set by hand). */
  source: text("source"),
  toRole: text("toRole").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

/**
 * A role waiting for someone who has no account yet. It is given when that
 * email first signs in, unless it was revoked or has expired.
 */
export const roleInvites = pgTable(
  "role_invites",
  {
    acceptedAt: timestamp("acceptedAt", { mode: "date", withTimezone: true }),
    acceptedUserId: text("acceptedUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    /** Lowercased and trimmed. */
    email: text("email").notNull(),
    expiresAt: timestamp("expiresAt", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    id: serial("id").primaryKey().notNull(),
    invitedById: text("invitedById").references(() => users.id, {
      onDelete: "set null",
    }),
    revokedAt: timestamp("revokedAt", { mode: "date", withTimezone: true }),
    role: text("role").notNull(),
  },
  (t) => [
    check(
      "role_invites_role_check",
      sql`${t.role} in ('mita', 'writer', 'member')`
    ),
    uniqueIndex("role_invites_open_email")
      .on(t.email)
      .where(sql`${t.acceptedAt} is null and ${t.revokedAt} is null`),
  ]
);

/** A member asking for a role; mita approve or decline it. */
export const accessRequests = pgTable(
  "access_requests",
  {
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp("decidedAt", { mode: "date", withTimezone: true }),
    decidedById: text("decidedById").references(() => users.id, {
      onDelete: "set null",
    }),
    id: serial("id").primaryKey().notNull(),
    role: text("role").notNull(),
    status: text("status", { enum: ["pending", "approved", "declined"] })
      .default("pending")
      .notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    check("access_requests_role_check", sql`${t.role} in ('writer')`),
    check(
      "access_requests_status_check",
      sql`${t.status} in ('pending', 'approved', 'declined')`
    ),
    uniqueIndex("access_requests_open_user")
      .on(t.userId)
      .where(sql`${t.status} = 'pending'`),
  ]
);

export const profiles = pgTable("profiles", {
  address: text("address"),
  bio: text("bio"),
  birthday: timestamp("birthday", { mode: "date" }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  location: text("location"),
  major: text("major"),
  /** What the member likes to be called; the Google name stays as is. */
  nickname: text("nickname"),
  phoneNumber: text("phoneNumber"),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
});

/** define one-to-one relationship. */
export const userRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

/** Who fills a slot on a schedule: a member account, or just a name for guests and unmatched names. */
export const scheduleAssignments = pgTable(
  "schedule_assignments",
  {
    id: serial("id").primaryKey().notNull(),
    /** Name as shown on the schedule; kept even when the member is linked. */
    name: text("name").notNull(),
    /** Order within a role when several people share it. */
    position: integer("position").default(0).notNull(),
    role: text("role").notNull(),
    scheduleId: integer("scheduleId")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),
    /** The guest speaker behind a preacher slot. */
    speakerId: integer("speakerId").references(() => speakers.id, {
      onDelete: "set null",
    }),
    userId: text("userId").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    uniqueIndex("schedule_assignments_slot").on(
      t.scheduleId,
      t.role,
      t.position
    ),
    check(
      "schedule_assignments_role_check",
      sql`${t.role} in (${sql.raw(SERVING_ROLES.map((role) => `'${role}'`).join(", "))})`
    ),
  ]
);

/**
 * Guest pastors who preach at services. They don't sign in, so they live
 * here rather than in `user`; the landing page's "Our pastors" lists the
 * active ones.
 */
export const speakers = pgTable("speakers", {
  active: boolean("active").default(true).notNull(),
  /** Other spellings on the schedule, normalised with `nameKey()`. */
  aliases: text("aliases").array().default(sql`'{}'::text[]`).notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  favoriteVerse: text("favoriteVerse"),
  id: serial("id").primaryKey().notNull(),
  /** As shown, title included: "Pdt. John Kusuma". */
  name: text("name").notNull().unique(),
  /** A site path ("/images/john.jpg") or a full image URL. */
  photoUrl: text("photoUrl"),
  story: text("story"),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** One period (about six months) of cooking and cleaning groups. */
export const groupTerms = pgTable("group_terms", {
  id: serial("id").primaryKey().notNull(),
  /** First day the groups apply; a term lasts until the next one starts. */
  startsOn: date("startsOn", { mode: "string" }).notNull().unique(),
});

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey().notNull(),
    /** As written on the schedule, e.g. "Group 3". */
    name: text("name").notNull(),
    termId: integer("termId")
      .notNull()
      .references(() => groupTerms.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("groups_term_name").on(t.termId, t.name)]
);

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: integer("groupId")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    id: serial("id").primaryKey().notNull(),
    /** Name as listed in the group; members without an account have only this. */
    name: text("name").notNull(),
    position: integer("position").default(0).notNull(),
    userId: text("userId").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [uniqueIndex("group_members_group_name").on(t.groupId, t.name)]
);

/**
 * A spelling of a person's name (as written on the schedule sheet or in a
 * group) linked to their account, so every slot and group entry with that
 * spelling points to the same member.
 */
export const nameLinks = pgTable("name_links", {
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  id: serial("id").primaryKey().notNull(),
  linkedById: text("linkedById").references(() => users.id, {
    onDelete: "set null",
  }),
  /** Normalised with `nameKey()`: lowercase, no dots, single spaces. */
  name: text("name").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

/** Workspace settings staff change on /admin/settings, one row per key (see `src/lib/settings.ts`). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey().notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedById: text("updatedById").references(() => users.id, {
    onDelete: "set null",
  }),
  value: text("value").notNull(),
});

export const accounts = pgTable(
  "account",
  {
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    id_token: text("id_token"),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    scope: text("scope"),
    session_state: text("session_state"),
    token_type: text("token_type"),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (account) => ({
    compositePK: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  expires: timestamp("expires", { mode: "date" }).notNull(),
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    expires: timestamp("expires", { mode: "date" }).notNull(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
  },
  (token) => ({
    compositePK: primaryKey({
      columns: [token.identifier, token.token],
    }),
  })
);

export const authenticators = pgTable(
  "authenticator",
  {
    counter: integer("counter").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialID: text("credentialID").notNull().unique(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    transports: text("transports"),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  })
);
