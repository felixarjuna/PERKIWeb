"use client";

import { type GetServerSidePropsContext } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function TodoList() {
  const { data: session } = useSession();

  const getTodos = api.todos.getTodos.useQuery();
  const addTodo = api.todos.addTodo.useMutation({
    onSettled: () => getTodos.refetch(),
  });

  return (
    <div className="p-20 text-cream-default">
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-2xl text-white">
          {session && <span>Logged in as {session.user?.name}</span>}
          {/* {secretMessage && <span> - {secretMessage}</span>} */}
        </p>
        <button
          className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={session ? () => void signOut() : () => void signIn()}
        >
          {session ? "Sign out" : "Sign in"}
        </button>
      </div>

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

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/sign-in",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}
