import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { updateUserParams } from "~/lib/db/schema/auth";
import { users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const safeUserColumns = {
  email: users.email,
  id: users.id,
  image: users.image,
  name: users.name,
};

export const userRouter = createTRPCRouter({
  getUserById: protectedProcedure.query(async ({ ctx }) => {
    const account = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);
    return account.at(0) ?? null;
  }),
  updateUser: protectedProcedure
    .input(updateUserParams)
    .mutation(async ({ ctx, input }) => {
      if (input.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own account.",
        });
      }
      await db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.session.user.id));
      return { success: true };
    }),
});
