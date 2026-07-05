import type { GetServerSidePropsContext } from "next";
import Template from "~/components/template";
import EditTakeawayForm from "./edit-takeaway-form";

export default function EditTakeawayPage() {
  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
      title="Edit takeaway"
    >
      <div className="mx-auto w-full max-w-4xl">
        <EditTakeawayForm />
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
