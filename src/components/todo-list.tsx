import { trpc } from "@/app/_trpc/client";

export default function TodoList() {
  const getTodos = trpc.todos.getTodos.useQuery();
  const addTodo = trpc.todos.addTodo.useMutation({
    onSettled: () => getTodos.refetch(),
  });

  return (
    <div>
      <div>{JSON.stringify(getTodos.data)}</div>
      <button
        onClick={() => {
          addTodo.mutate("hello");
        }}
        className="cursor-pointer bg-white rounded-xl z-20"
      >
        tes woe
      </button>
    </div>
  );
}
