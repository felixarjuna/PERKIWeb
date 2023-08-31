"use client";
import { trpc } from "../_trpc/client";

export default function Todos() {
  const { data: todos } = trpc.todos.getTodos.useQuery();
  return (
    <div className="text-cream-default p-20">
      <h2>Your todo list</h2>
      {todos?.map((todo, index) => {
        return <div key={index}>{JSON.stringify(todo)}</div>;
      })}
    </div>
  );
}
