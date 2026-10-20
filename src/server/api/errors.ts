import { TRPCError } from "@trpc/server";

/** Postgres SQLSTATE codes the routers translate into tRPC errors. */
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_UNIQUE_VIOLATION = "23505";

/**
 * Whether `error` is a Postgres error with the given SQLSTATE. Drizzle wraps
 * driver errors in `DrizzleQueryError`, so the code may sit on `cause`.
 */
export const isPgError = (error: unknown, code: string): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if ("code" in error && error.code === code) {
    return true;
  }
  return "cause" in error && isPgError(error.cause, code);
};

/**
 * Returns the single row affected by an update/delete `.returning()`, or
 * throws NOT_FOUND when the id matched nothing.
 */
export const affectedRow = <T>(rows: T[], entity: string): T => {
  const [row] = rows;
  if (row === undefined) {
    throw new TRPCError({ code: "NOT_FOUND", message: `${entity} not found.` });
  }
  return row;
};
