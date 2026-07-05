import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import {
  insertUserParams,
  insertUserSchema,
  updatePasswordParams,
  updateUserParams,
  updateUserSchema,
} from "~/lib/db/schema/auth";
import { users } from "~/lib/db/schema/schema";
import { db } from "~/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

/** Columns that are safe to expose to clients (never the password hash). */
const safeUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  image: users.image,
  hasPassword: sql<boolean>`${users.hashedPassword} is not null`,
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
  createUser: publicProcedure
    .input(insertUserParams)
    .mutation(async ({ input }) => {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.username))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username or email already exists",
        });
      }

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
          message,
        });
      }
    }),
  /**
   * User can only change name or username here.
   * For password update, refer to "updatePassword" method
   */
  updateUser: protectedProcedure
    .input(updateUserParams)
    .mutation(async ({ ctx, input }) => {
      if (input.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own account.",
        });
      }

      const taken = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, input.username), ne(users.id, input.id)))
        .limit(1);
      if (taken.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username or email already exists",
        });
      }

      const newUser = updateUserSchema.parse({
        ...input,
        email: input.username,
      });

      try {
        await db.update(users).set(newUser).where(eq(users.id, input.id));
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
  updatePassword: protectedProcedure
    .input(updatePasswordParams)
    .mutation(async ({ ctx, input }) => {
      if (input.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only change your own password.",
        });
      }

      const account = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      const user = account.at(0);

      if (!user?.hashedPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User cannot be found. Please try to re login.",
        });
      }

      const isOldPasswordValid = await bcrypt.compare(
        input.currentPassword,
        user.hashedPassword
      );
      if (!isOldPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You have entered an invalid old password.",
        });
      }

      if (input.newPassword !== input.retypeNewPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your retyped password does not match the new password.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      try {
        await db
          .update(users)
          .set({ hashedPassword })
          .where(eq(users.id, input.id));
        return { success: true };
      } catch (err) {
        const message = (err as Error).message ?? "Error, please try again";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
