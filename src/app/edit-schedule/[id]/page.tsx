import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import EditScheduleForm from "./edit-schedule-form";

export default async function EditSchedulePage({
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
          `/edit-schedule/${encodeURIComponent((await params).id)}`,
          await searchParams
        )
      )
    );
  }

  return (
    <Template
      subtitle={
        <div className="flex flex-col gap-y-1">
          <p>
            “There is a time for everything, and a season for every activity
            under the heavens.”
          </p>
          <p>– Ecclesiastes 3:1</p>
        </div>
      }
      title="Edit schedule"
    >
      <div className="w-full">
        <EditScheduleForm />
      </div>
    </Template>
  );
}
