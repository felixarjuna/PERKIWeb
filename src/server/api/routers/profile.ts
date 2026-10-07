import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { profiles, users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { addProfileSchema } from "../schema/schema";

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
          message:
            "Sorry, it seems like you already submitted your profile. Please contact the administrator if it is not the case.",
        });
      }

      return await db.insert(profiles).values({ ...input });
    }),
  getUserProfiles: protectedProcedure.query(
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
});
