"use client";

import { type GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Navigation from "~/components/navigation";
import EditScheduleForm from "./edit-schedule-form";

export default function EditSchedulePage() {
  return (
    <section className="min-h-screen bg-dark-green-default pb-40 text-cream-default">
      <Navigation showNav={true} />

      <div className="flex flex-col items-center px-24 pt-20 xs:px-12">
        <div className="flex w-1/2 flex-col items-center justify-center gap-8 py-16 pb-4 xs:w-full xs:py-8">
          <h1 className="font-reimbrandt text-9xl xs:text-4xl">Schedule</h1>
          <div className="flex flex-col gap-y-2 text-2xl xs:text-base">
            <p>
              “There is a time for everything, and a season for every activity
              under the heavens.”
            </p>
            <p>– Ecclesiastes 3:1</p>
          </div>
        </div>

        <div className="w-1/2 xs:w-full">
          <EditScheduleForm />
        </div>
      </div>
    </section>
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
