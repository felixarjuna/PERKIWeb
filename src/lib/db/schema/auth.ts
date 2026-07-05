import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

/**
 * Server-side schema used to validate a user row before insertion.
 * Never expose this to clients: it contains `hashedPassword`.
 */
export const insertUserSchema = createInsertSchema(users);

/** Payload accepted from the signup form. */
export const insertUserParams = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

/**
 * Whitelist of columns a user may update on their own account.
 * `hashedPassword` is deliberately excluded — see `updatePassword`.
 */
export const updateUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullish(),
});

/** Payload accepted from the account form. */
export const updateUserParams = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  image: z.string().nullish(),
});

/** Payload accepted from the change-password form. */
export const updatePasswordParams = z.object({
  id: z.string(),
  currentPassword: z
    .string()
    .min(1, { message: "Password must contain at least 1 character(s)" }),
  newPassword: z
    .string()
    .min(1, { message: "Password must contain at least 1 character(s)" }),
  retypeNewPassword: z
    .string()
    .min(1, { message: "Password must contain at least 1 character(s)" }),
});

export type NewUserParams = z.infer<typeof insertUserParams>;
export type UpdateUserParams = z.infer<typeof updateUserParams>;
export type UpdatePasswordParams = z.infer<typeof updatePasswordParams>;
