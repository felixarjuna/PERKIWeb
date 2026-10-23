import { redirect } from "next/navigation";
import Template from "~/components/template";
import {
  authPageUrl,
  type PageSearchParams,
  requestedPath,
} from "~/lib/auth-redirect";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import DutiesView from "./duties-view";

export default async function DutiesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const session = await auth();
  if (!session) {
    redirect(
      authPageUrl("signin", requestedPath("/duties", await searchParams))
    );
  }
  const { past, upcoming } = await api.schedules.myDuties();
  return (
    <Template
      subtitle="When you serve, and when your group cooks or cleans."
      title="Your duties"
    >
      <DutiesView now={new Date()} past={past} upcoming={upcoming} />
    </Template>
  );
}
