import { publicProcedure, router } from "@/server/trpc";
import { z } from "zod";

export const todoRouter = router({
  getTodos: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.todos.findMany();
  }),
  addTodo: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    ctx.prisma.todos.create({ data: { content: input, done: 0 } });
    return true;
  }),
});
