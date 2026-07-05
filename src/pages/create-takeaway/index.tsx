import type { GetServerSidePropsContext } from "next";
import Template from "~/components/template";
import AddTakeawayForm from "./add-takeaway-form";

export default function AddTakeawayPage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
      title="Add takeaway"
    >
      <div className="mx-auto w-full max-w-4xl">
        <AddTakeawayForm />
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
