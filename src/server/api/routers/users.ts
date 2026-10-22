import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { prayers, users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { getRole } from "~/server/authz";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const safeUserColumns = {
  email: users.email,
  id: users.id,
  image: users.image,
  name: users.name,
};

export const userRouter = createTRPCRouter({
  /**
   * Deletes the caller's own account. Their prayers go with it; the foreign
   * keys remove the profile, Google links and own role history, and keep
   * takeaways, role changes they made, and schedule/group names without them.
   */
  deleteMine: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // There must always be exactly one owner.
    if ((await getRole(userId)) === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "The owner's account can't be deleted.",
      });
    }
    await db.transaction(async (tx) => {
      await tx.delete(prayers).where(eq(prayers.authorId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  }),
  getUserById: protectedProcedure.query(async ({ ctx }) => {
    const account = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .limit(1);
    return account.at(0) ?? null;
  }),
});
