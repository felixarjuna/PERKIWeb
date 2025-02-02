import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { profiles, users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { addProfileSchema } from "../schema/schema";

export const profileRouter = createTRPCRouter({
  addUserProfile: publicProcedure
    .input(addProfileSchema)
    .mutation(async ({ input }) => {
      const isExists =
        (
          await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, input.userId))
        ).length > 0;

      if (isExists)
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Sorry, it seems like you already submitted your profile. Please contact the administrator if it is not the case.",
        });

      return await db.insert(profiles).values({ ...input });
    }),
  getUserProfiles: publicProcedure.query(async () => {
    return await db
      .select()
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id));
  }),
});
