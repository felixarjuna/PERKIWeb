import { eq } from "drizzle-orm";
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
});
