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

import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export const userRouter = createTRPCRouter({
  getUsers: publicProcedure.query(async () => {
    return await db.select().from(users);
  }),
  getUserById: publicProcedure.input(userIdSchema).query(async ({ input }) => {
    const accounts = await db
      .select()
      .from(users)
      .where(eq(users.id, input.id));
    return accounts.at(0) ?? null;
  }),
  createUser: publicProcedure
    .input(insertUserParams)
    .mutation(async ({ input }) => {
      // Return error if username or email already exists
      const _users = db.select().from(users);

      const isUsernameExists = await _users.where(
        eq(users.email, input.username),
      );
      if (isUsernameExists.length > 0)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username or email already exists",
        });

      // Password should be hashed
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const newUser = insertUserSchema.parse({
        ...input,
        id: randomUUID(),
        email: input.username,
        hashedPassword,
      });

      try {
        await db.insert(users).values(newUser);
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: message,
        });
      }
    }),
  /**
   * User can only change name or username here.
   * For password update, refer to "updatePassword" method
   */
  updateUser: publicProcedure
    .input(updateUserParams)
    .mutation(async ({ input }) => {
      // Return error if username or email already exists
      const _users = db.select().from(users);

      const isUsernameExists = await _users.where(
        eq(users.email, input.username),
      );
      if (isUsernameExists.length > 0)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username or email already exists",
        });

      const newUser = updateUserSchema.parse({
        ...input,
        email: input.username,
      });

      try {
        await db.update(users).set(newUser).where(eq(users.id, input.id));
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
