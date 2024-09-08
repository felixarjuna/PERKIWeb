import { type GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Template from "~/components/template";
import { authOptions } from "~/server/auth";
import EditTakeawayForm from "./edit-takeaway-form";

export default function EditTakeawayPage() {
  return (
    <Template
      title="Edit takeaway"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
    >
      <div className="w-full">
        <EditTakeawayForm />
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
