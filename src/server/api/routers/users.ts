import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import {
  insertUserParams,
  insertUserSchema,
  updateUserParams,
  updateUserSchema,
  userIdSchema,
  users,
} from "~/lib/db/schema/auth";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getUsers: publicProcedure.query(async () => {
    return await db.select().from(users);
  }),
  getUserById: publicProcedure.input(userIdSchema).query(({ input }) => {
    return db.select().from(users).where(eq(users.id, input.id));
  }),
  createUser: publicProcedure
    .input(insertUserParams)
    .mutation(async ({ input }) => {
      const newUser = insertUserSchema.parse({ ...input });
      try {
        await db.insert(users).values(newUser);
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: message,
        });
      }
    }),
  updateUser: publicProcedure
    .input(updateUserParams)
    .mutation(async ({ input }) => {
      const session = await getServerSession();
      if (!session)
        return new TRPCError({
          code: "UNAUTHORIZED",
          message: "User session not found",
        });

      const newUser = updateUserSchema.parse({
        ...userIdSchema,
        id: session.user.id,
      });

      try {
        await db
          .update(users)
          .set(newUser)
          .where(and(eq(users.id, input.id), eq(users.id, session.user.id)));
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: message,
        });
      }
    }),
  deleteUser: publicProcedure
    .input(userIdSchema)
    .mutation(async ({ input }) => {
      const session = await getServerSession();
      if (!session)
        return new TRPCError({
          code: "UNAUTHORIZED",
          message: "User session not found",
        });

      try {
        await db
          .delete(users)
          .where(and(eq(users.id, input.id), eq(users.id, session.user.id)));
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: message,
        });
      }
    }),
});
