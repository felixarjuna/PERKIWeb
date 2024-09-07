import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const eventTypeEnum = pgEnum("event_type", [
  "church_service",
  "bible_study",
]);
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  bibleVerse: text("bibleVerse").notNull(),
  date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
  type: eventTypeEnum("type").notNull(),

  preacher: text("preacher"),
  leader: text("leader").notNull(),
  musician: text("musician").notNull(),
  noteWriter: text("noteWriter").notNull(),
  multimedia: text("multimedia"),
  accommodation: text("accommodation"),
  cookingGroup: text("cookingGroup"),
  cleaningGroup: text("cleaningGroup").notNull(),
});

export const takeaways = pgTable("takeaways", {
  id: serial("id").primaryKey().notNull(),
  scheduleId: integer("scheduleId").notNull(),
  keypoints: text("keypoints").notNull(),
  contributors: json("contributors").notNull(),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey().notNull(),
  name: text("name"),
  content: text("content").notNull(),
  count: integer("count").default(0).notNull(),
  prayerNames: json("prayerNames").notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" }),
});

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccount>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);
