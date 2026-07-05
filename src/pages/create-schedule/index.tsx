"use client";

import type { GetServerSidePropsContext } from "next";
import Template from "~/components/template";
import AddScheduleForm from "./add-schedule-form";

export default function AddSchedulePage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-2 text-base xs:text-2xl">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
      title="Add schedule"
    >
      <div className="mx-auto w-full max-w-4xl">
        <AddScheduleForm />
      </div>
    </Template>
  );
}

import { auth } from "~/server/auth";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await auth(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}
