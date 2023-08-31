import { todos } from "@/db/schema";
import { db } from "@/server";
import { publicProcedure, router } from "@/server/trpc";
import { z } from "zod";

export const todoRouter = router({
  getTodos: publicProcedure.query(() => {
    return db.select().from(todos);
  }),
  addTodo: publicProcedure.input(z.string()).mutation(async (opts) => {
    await db.insert(todos).values({ content: opts.input, done: 0 });
    return true;
  }),
});
