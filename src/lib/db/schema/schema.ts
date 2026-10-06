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
import { relations } from "drizzle-orm/relations";
import type { AdapterAccount } from "next-auth/adapters";
import { z } from "zod";

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

export const takeaways = pgTable("takeaways", {
  contributors: json("contributors").notNull(),
  createdAt: timestamp("createdAt", {
    mode: "date",
    withTimezone: true,
  }).defaultNow(),
  id: serial("id").primaryKey().notNull(),
  keypoints: text("keypoints").notNull(),
  scheduleId: integer("scheduleId").notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const prayers = pgTable("prayers", {
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
});

export const users = pgTable("user", {
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
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
  phoneNumber: text("phoneNumber"),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date()),
  userId: text("userId")
    .notNull()
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
