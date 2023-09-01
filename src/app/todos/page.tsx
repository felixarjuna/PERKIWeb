"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "../_trpc/client";

export default function TodoList() {
  const getTodos = trpc.todos.getTodos.useQuery();
  const addTodo = trpc.todos.addTodo.useMutation({
    onSettled: () => getTodos.refetch(),
  });

  return (
    <div className="p-20 text-cream-default">
      <h2>Todo Test endpoint</h2>
      {getTodos.data?.map((todo, index) => {
        return <div key={index}>{JSON.stringify(todo)}</div>;
      })}
      <Button
        onClick={() => {
          addTodo.mutate("hello world");
        }}
      >
        Create new todo
      </Button>
    </div>
  );
}
