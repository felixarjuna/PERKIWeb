import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import AddScheduleForm from "./add-schedule-form";

export default async function AddSchedulePage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl(
        "signin",
        requestedPath("/create-schedule", await searchParams)
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
      title="Add schedule"
    >
      <div className="w-full">
        <AddScheduleForm />
      </div>
    </Template>
  );
}
