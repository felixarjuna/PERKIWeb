import { type GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import Template from "~/components/template";
import { authOptions } from "~/server/auth";
import AddTakeawayForm from "./add-takeaway-form";

export default function AddTakeawayPage() {
  return (
    <Template
      title="Add takeaway"
      subtitle={
        <div className="flex flex-col gap-y-2 text-base sm:text-2xl">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
    >
      <div className="w-full">
        <AddTakeawayForm />
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
