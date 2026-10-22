"use client";

import { useId } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

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
  const remove = api.takeawayComments.remove.useMutation();
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
            variant="secondary"
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
                  onDelete={async (id) => {
                    await remove.mutateAsync({ id });
                    await refresh();
                    toast.success("Comment deleted.");
                  }}
                  onResolve={(id, resolved) => resolve.mutate({ id, resolved })}
                  pending={resolve.isPending || remove.isPending}
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
