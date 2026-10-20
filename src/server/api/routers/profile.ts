import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { profiles, users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { isPgError, PG_UNIQUE_VIOLATION } from "../errors";
import { addProfileSchema } from "../schema/schema";

const ALREADY_REGISTERED =
  "Sorry, it seems like you already submitted your profile. Please contact the administrator if it is not the case.";

export const profileRouter = createTRPCRouter({
  addUserProfile: protectedProcedure
    .input(addProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only submit your own profile.",
        });
      }

      const isExists =
        (
          await db
            .select({ userId: profiles.userId })
            .from(profiles)
            .where(eq(profiles.userId, input.userId))
            .limit(1)
        ).length > 0;

      if (isExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: ALREADY_REGISTERED,
        });
      }

      // The check above handles the common case; the unique index on
      // `profiles.userId` catches two simultaneous submits.
      return await db
        .insert(profiles)
        .values({ ...input })
        .catch((error: unknown) => {
          if (isPgError(error, PG_UNIQUE_VIOLATION)) {
            throw new TRPCError({
              cause: error,
              code: "CONFLICT",
              message: ALREADY_REGISTERED,
            });
          }
          throw error;
        });
    }),
  /** Member directory with contact details: admins only. */
  getUserProfiles: adminProcedure.query(
    async () =>
      await db
        .select({
          profiles,
          user: {
            email: users.email,
            id: users.id,
            image: users.image,
            name: users.name,
          },
        })
        .from(profiles)
        .leftJoin(users, eq(profiles.userId, users.id))
  ),
  /** Whether the signed-in user has already registered as a member. */
  hasOwnProfile: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, ctx.session.user.id))
      .limit(1);
    return rows.length > 0;
  }),
});
