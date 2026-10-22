"use client";

import { useId } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api, type RouterOutputs } from "~/trpc/react";
import { CommentForm } from "./comment-form";

type Comment = RouterOutputs["takeawayComments"]["list"]["comments"][number];

function CommentItem({
  comment,
  canComment,
  pending,
  onResolve,
}: {
  comment: Comment;
  canComment: boolean;
  pending: boolean;
  onResolve: (id: number, resolved: boolean) => void;
}) {
  return (
    <li className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-medium">
          {comment.author?.name ?? "Deleted account"}
          {comment.mine ? " (you)" : ""}
        </p>
        <time
          className="text-muted-foreground"
          dateTime={comment.createdAt.toISOString()}
        >
          {comment.createdAt.toLocaleString("en-GB", {
            timeZone: "Europe/Berlin",
          })}
        </time>
      </div>
      {comment.quote ? (
        <blockquote className="whitespace-pre-wrap break-words border-l-2 pl-3 text-muted-foreground text-sm">
          {comment.quote}
        </blockquote>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {comment.resolvedAt
            ? `Resolved by ${comment.resolvedBy?.name ?? "Deleted account"}`
            : "Open"}
        </p>
        {canComment ? (
          <Button
            disabled={pending}
            onClick={() => onResolve(comment.id, !comment.resolvedAt)}
            size="sm"
            type="button"
            variant="outline"
          >
            {comment.resolvedAt ? "Reopen" : "Resolve"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function TakeawayComments({ takeawayId }: { takeawayId: number }) {
  const headingId = useId();
  const utils = api.useUtils();
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  const refresh = async () => {
    await utils.takeawayComments.list.invalidate({ takeawayId });
  };
  const add = api.takeawayComments.add.useMutation();
  const resolve = api.takeawayComments.setResolved.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: refresh,
  });

  // Published notes belonging to another writer have no accessible thread.
  if (thread.error?.data?.code === "NOT_FOUND") {
    return null;
  }
  const { data } = thread;
  const openCount =
    data?.comments.filter((comment) => !comment.resolvedAt).length ?? 0;
  return (
    <section
      aria-labelledby={headingId}
      className="mt-8 min-w-0 space-y-5 border-t pt-6"
    >
      <div className="space-y-1">
        <h2 className="type-subheading" id={headingId}>
          Review comments
        </h2>
        <p className="text-muted-foreground text-sm">
          Internal feedback for writers and staff.
        </p>
      </div>
      {thread.isPending ? <p role="status">Loading comments…</p> : null}
      {thread.error ? (
        <div role="alert">
          <p>Couldn’t load comments.</p>
          <Button
            onClick={() => thread.refetch()}
            type="button"
            variant="outline"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {data ? (
        <>
          <p className="font-medium text-sm" role="status">
            {openCount} open · {data.comments.length - openCount} resolved
          </p>
          {data.comments.length ? (
            <ol className="space-y-3">
              {data.comments.map((comment) => (
                <CommentItem
                  canComment={data.canComment}
                  comment={comment}
                  key={comment.id}
                  onResolve={(id, resolved) => resolve.mutate({ id, resolved })}
                  pending={resolve.isPending}
                />
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">
              No comments yet. Add the first review note below.
            </p>
          )}
          {data.canComment ? (
            <CommentForm
              onSubmit={async (input) => {
                await add.mutateAsync({ ...input, takeawayId });
                await refresh();
                toast.success("Comment added.");
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              This thread is read-only after publication.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
