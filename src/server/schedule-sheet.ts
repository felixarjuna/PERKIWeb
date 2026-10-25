import { TRPCError } from "@trpc/server";
import { scheduleSheetId } from "~/server/settings";

/** The schedule sheet's id from Settings, or a readable error when unset. */
export async function requireSheetId() {
  const id = await scheduleSheetId();
  if (!id) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No schedule sheet is set. Add its link on the Settings page.",
    });
  }
  return id;
}

/** Calls Google and turns its failures into one readable error. */
export const fromGoogle = <T>(request: () => Promise<T>): Promise<T> =>
  request().catch((error: unknown) => {
    throw new TRPCError({
      cause: error,
      code: "BAD_GATEWAY",
      message: "The schedule sheet couldn't be read from Google. Try again.",
    });
  });
