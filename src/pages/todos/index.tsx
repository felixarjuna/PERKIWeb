"use client";

import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function TodoList() {
  const getTodos = api.todos.getTodos.useQuery();
  const addTodo = api.todos.addTodo.useMutation({
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
