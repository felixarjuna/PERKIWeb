import { redirect } from "next/navigation";
import Template from "~/components/template";
import { auth } from "~/server/auth";
import AddTakeawayForm from "./add-takeaway-form";

export default async function AddTakeawayPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>“Your word is a lamp to my feet and a light to my path”</p>
          <p>– Psalm 119:105</p>
        </div>
      }
      title="Add takeaway"
    >
      <div className="w-full">
        <AddTakeawayForm />
      </div>
    </Template>
  );
}
