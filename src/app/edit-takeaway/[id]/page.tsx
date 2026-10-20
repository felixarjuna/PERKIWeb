import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import EditTakeawayForm from "./edit-takeaway-form";

export default async function EditTakeawayPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PageSearchParams>;
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath(
          `/edit-takeaway/${encodeURIComponent((await params).id)}`,
          await searchParams
        )
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
      title="Edit takeaway"
    >
      <div className="w-full">
        <EditTakeawayForm />
      </div>
    </Template>
  );
}
