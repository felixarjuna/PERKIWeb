import { z } from "zod";
import { takeaways } from "~/lib/db/schema/schema";
import { normalizeTldr, takeawayTldrSchema } from "~/lib/takeaway-tldr";
import { db } from "~/server";
import { affectedRow } from "../errors";
import { createTRPCRouter, takeawayProcedure } from "../trpc";
import { assertCanManage } from "./takeaway";

/**
 * A takeaway's TL;DR. It lives on the takeaway, so it follows the notes:
 * the same people edit it until it is published, and the public queries
 * only return it once staff publish the takeaway.
 */
export const takeawayTldrRouter = createTRPCRouter({
  save: takeawayProcedure
    .input(z.object({ id: z.number(), tldr: takeawayTldrSchema }))
    .mutation(async ({ ctx, input }) => {
      const where = await assertCanManage(input.id, ctx.session.user.id);
      return affectedRow(
        await db
          .update(takeaways)
          .set({ tldr: normalizeTldr(input.tldr) })
          .where(where)
          .returning({ id: takeaways.id }),
        "Takeaway"
      );
    }),
});
