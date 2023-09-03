import { z } from "zod";
import { todos } from "~/db/schema";
import { db } from "~/server";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const todoRouter = createTRPCRouter({
  getTodos: publicProcedure.query(async () => {
    return await db.select().from(todos);
  }),
  addTodo: publicProcedure.input(z.string()).mutation(async (opts) => {
    await db.insert(todos).values({ content: opts.input, done: 0 });
    return true;
  }),
});
