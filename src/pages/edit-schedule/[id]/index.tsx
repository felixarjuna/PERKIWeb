"use client";

import type { GetServerSidePropsContext } from "next";
import Template from "~/components/template";
import EditScheduleForm from "./edit-schedule-form";

export default function EditSchedulePage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
      title="Edit schedule"
    >
      <div className="mx-auto w-full max-w-4xl">
        <EditScheduleForm />
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
