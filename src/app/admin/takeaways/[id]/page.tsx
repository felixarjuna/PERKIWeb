import { TRPCError } from "@trpc/server";
import { ArrowLeft, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "~/components/admin/admin-shell";
import { TakeawayActions } from "~/components/admin/content/takeaway-actions";
import { TakeawayReview } from "~/components/admin/content/takeaway-review";
import { TakeawayMarkdown } from "~/components/takeaway-markdown";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { type PageSearchParams, requestedPath } from "~/lib/auth-redirect";
import { takeawayBadgeStyles } from "~/lib/takeaway-badge-styles";
import { statusLabels } from "~/lib/takeaway-status";
import { canManageTakeaway } from "~/server/api/routers/takeaway";
import { adminShellProps, requireTakeawayAccess } from "~/server/authz";
import { api } from "~/trpc/server";

async function loadReview(id: number) {
  try {
    // Applies the same ownership/status read rules as every other note view.
    return await api.takeaways.getTakeawayById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

/**
 * The workspace reading view every takeaway opens in: reviewers comment on
 * and suggest edits to passages here, and its writer and staff edit from it.
 */
export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { id } = await params;
  const { role, session } = await requireTakeawayAccess(
    requestedPath(
      `/admin/takeaways/${encodeURIComponent(id)}`,
      await searchParams
    )
  );
  const takeawayId = Number(id);
  if (!(Number.isSafeInteger(takeawayId) && takeawayId > 0)) {
    notFound();
  }
  const { schedules: schedule, takeaways: note } = await loadReview(takeawayId);
  const canEdit = await canManageTakeaway(takeawayId, session.user.id);
  return (
    <AdminShell
      {...(await adminShellProps(role))}
      actions={
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/admin/takeaways"
        >
          <ArrowLeft aria-hidden="true" data-icon="inline-start">
            <title>Back to takeaways</title>
          </ArrowLeft>
          Back to takeaways
        </Link>
      }
      section="Takeaways"
      subtitle="Read the takeaway and review its feedback below."
      title="Review takeaway"
    >
      <article className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="type-heading break-words">{schedule.title}</h2>
          <Badge
            data-slot="takeaway-status"
            size="status"
            {...takeawayBadgeStyles[note.status]}
          >
            {statusLabels[note.status]}
          </Badge>
        </div>
        {/* Next steps sit under the title, above the long thread below. */}
        <div className="flex flex-wrap items-center gap-2 empty:hidden">
          {canEdit ? (
            <Link
              aria-label={`Edit ${schedule.title}`}
              className={buttonVariants()}
              href={`/admin/takeaways/${note.id}/edit`}
            >
              <PenLine aria-hidden="true" data-icon="inline-start">
                <title>Edit</title>
              </PenLine>
              Edit
            </Link>
          ) : null}
          <TakeawayActions
            actions={[]}
            canManage={false}
            id={note.id}
            name={schedule.title}
            status={note.status}
          />
        </div>
        {/* Reviewers check both parts; they share one edge and one label style. */}
        <section aria-labelledby="review-tldr" className="flex flex-col gap-2">
          <p className="type-eyebrow text-muted-foreground" id="review-tldr">
            TL;DR
          </p>
          {note.tldr ? (
            <TakeawayMarkdown markdown={note.tldr} />
          ) : (
            <p className="type-body-sm text-muted-foreground">
              No TL;DR yet. Ask the writer to add one before it is published.
            </p>
          )}
        </section>
        <section
          aria-labelledby="review-notes"
          className="flex flex-col gap-2 border-t pt-5"
        >
          <p className="type-eyebrow text-muted-foreground" id="review-notes">
            Notes
          </p>
          <TakeawayReview takeawayId={takeawayId}>
            <TakeawayMarkdown markdown={note.keypoints} />
          </TakeawayReview>
        </section>
      </article>
    </AdminShell>
  );
}
