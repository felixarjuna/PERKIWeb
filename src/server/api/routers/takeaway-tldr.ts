import { z } from "zod";
import { takeawayTldrSchema } from "~/lib/takeaway-tldr";
import { createTRPCRouter, takeawayProcedure } from "../trpc";
import { saveText } from "./takeaway-revisions";

/**
 * A takeaway's TL;DR. It lives on the takeaway, so it follows the notes:
 * the same people edit it, a published one changes through its correction
 * (#74), and the public queries only return the published one.
 */
export const takeawayTldrRouter = createTRPCRouter({
  save: takeawayProcedure
    .input(z.object({ id: z.number(), tldr: takeawayTldrSchema }))
    .mutation(({ ctx, input }) =>
      saveText(ctx.session.user.id, input.id, { tldr: input.tldr })
    ),
});
