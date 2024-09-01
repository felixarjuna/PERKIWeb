"use client";

import { type GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Template from "~/components/template";
import { authOptions } from "~/server/auth";
import AddScheduleForm from "./add-schedule-form";

export default function AddSchedulePage() {
  return (
    <Template
      title="Add schedule"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base xs:text-2xl">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
    >
      <div className="w-full sm:w-1/2">
        <AddScheduleForm />
      </div>
    </Template>
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
