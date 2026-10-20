import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { getUsernameFromName } from "~/lib/utils";
import { auth } from "~/server/auth";
import AddTakeawayForm from "./add-takeaway-form";

export default async function AddTakeawayPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath("/create-takeaway", await searchParams)
      )
    );
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
        <AddTakeawayForm
          username={getUsernameFromName(session.user.name ?? "")}
        />
      </div>
    </Template>
  );
}
