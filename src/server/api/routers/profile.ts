import { and, eq, isNull, sql } from "drizzle-orm";
import { profiles, users } from "~/lib/db/schema/schema";
import { profileCompletion } from "~/lib/profile-completion";
import { normalizeRole } from "~/lib/roles";
import { SETTING_KEYS } from "~/lib/settings";
import { db } from "~/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getSetting } from "~/server/settings";
import { saveProfileSchema } from "../schema/schema";

const ownProfileColumns = {
  address: profiles.address,
  birthday: profiles.birthday,
  location: profiles.location,
  major: profiles.major,
  phoneNumber: profiles.phoneNumber,
};

/** The caller's member details, how complete they are, and whether to welcome them. */
async function loadOwnProfile(userId: string) {
  const [[profile], [user]] = await Promise.all([
    db
      .select(ownProfileColumns)
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1),
    db
      .select({ welcomeSeenAt: users.welcomeSeenAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  const own = profile ?? null;
  return {
    completion: profileCompletion(own),
    profile: own,
    welcomeDue: !(own || user?.welcomeSeenAt),
  };
}

const markWelcomeSeen = (userId: string) =>
  db
    .update(users)
    .set({ welcomeSeenAt: sql`now()` })
    .where(and(eq(users.id, userId), isNull(users.welcomeSeenAt)));

export const profileRouter = createTRPCRouter({
  /** Member directory with contact details: admins only. */
  getUserProfiles: adminProcedure.query(async () => {
    const rows = await db
      .select({
        profiles,
        user: {
          email: users.email,
          id: users.id,
          image: users.image,
          name: users.name,
          role: users.role,
        },
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id));
    return rows.map((row) => ({
      ...row,
      user: row.user
        ? { ...row.user, role: normalizeRole(row.user.role) }
        : null,
    }));
  }),
  /** Records that the welcome step was skipped. */
  markWelcomeSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await markWelcomeSeen(ctx.session.user.id);
  }),
  mine: protectedProcedure.query(({ ctx }) =>
    loadOwnProfile(ctx.session.user.id)
  ),
  /**
   * Saves the caller's own details. Only the fields given change; an empty
   * string clears one. The first save creates the profile.
   */
  saveMine: protectedProcedure
    .input(saveProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const values = Object.fromEntries(
        Object.entries(input)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, value === "" ? null : value])
      );
      await db
        .insert(profiles)
        .values({ ...values, userId })
        .onConflictDoUpdate({
          // A no-op update still returns the row when nothing was given.
          set: { ...values, updatedAt: new Date() },
          target: profiles.userId,
        });
      await markWelcomeSeen(userId);
      return loadOwnProfile(userId);
    }),
  /** The WhatsApp group link, only for members with a complete profile. */
  whatsappGroup: protectedProcedure.query(async ({ ctx }) => {
    const [link, own] = await Promise.all([
      getSetting(SETTING_KEYS.whatsappGroupUrl),
      loadOwnProfile(ctx.session.user.id),
    ]);
    const unlocked = own.completion.state === "complete";
    return {
      configured: link !== null,
      unlocked,
      url: unlocked ? link : null,
    };
  }),
});
