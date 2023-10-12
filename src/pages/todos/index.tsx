"use client";

import { type GetServerSidePropsContext } from "next";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import Navigation from "~/components/navigation";
import { Button } from "~/components/ui/button";
import { authOptions } from "~/server/auth";
import { api } from "~/utils/api";

export default function TodoList() {
  const { data: session } = useSession();

  const getTodos = api.todos.getTodos.useQuery();
  const addTodo = api.todos.addTodo.useMutation({
    onSettled: () => getTodos.refetch(),
  });

  return (
    <div className="flex flex-col p-20 text-cream-default">
      <Navigation showNav />
      <div className="flex items-center justify-center gap-4 place-self-end ">
        <p className="text-center text-xl">
          {session && <span>Welcome, {session.user?.name}</span>}
          {/* {secretMessage && <span> - {secretMessage}</span>} */}
        </p>
        <Button
          className="px-10 py-3 font-semibold"
          onClick={session ? () => void signOut() : () => void signIn()}
        >
          {session ? "Sign out" : "Sign in"}
        </Button>
      </div>

      <h2>Todo Test endpoint</h2>
      {getTodos.data?.map((todo, index) => {
        return <div key={index}>{JSON.stringify(todo)}</div>;
      })}
      <Button
        className="mt-4 w-fit"
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
        destination: authOptions.pages?.signIn,
        permanent: false,
      },
    };
  }

  return { props: { session } };
}
