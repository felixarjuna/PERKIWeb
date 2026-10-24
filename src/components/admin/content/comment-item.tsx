"use client";

import { Check, CircleCheck, CircleDot, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { PersonAvatar } from "~/components/person-avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { reviewTargetLabel } from "~/lib/review-target";
import type { RouterOutputs } from "~/trpc/react";

type Comment = RouterOutputs["takeawayComments"]["list"]["comments"][number];

export function CommentItem({
  comment,
  canComment,
  pending,
  onResolve,
  onDelete,
}: {
  comment: Comment;
  canComment: boolean;
  pending: boolean;
  onResolve: (id: number, resolved: boolean) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  const name = comment.author?.name ?? "Deleted account";
  const resolved = Boolean(comment.resolvedAt);
  const StatusIcon = resolved ? CircleCheck : CircleDot;
  const ActionIcon = resolved ? RotateCcw : Check;
  return (
    <li className="flex items-start gap-3">
      <PersonAvatar person={{ image: comment.author?.image ?? null, name }} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
          <p className="font-medium text-sm">
            {name}
            {comment.mine ? " (you)" : ""}
          </p>
          <time
            className="text-muted-foreground text-xs"
            dateTime={comment.createdAt.toISOString()}
            title={comment.createdAt.toLocaleString("en-GB", {
              timeZone: "Europe/Berlin",
            })}
          >
            {comment.createdAt.toLocaleString("en-GB", {
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              timeZone: "Europe/Berlin",
            })}
          </time>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl rounded-tl-sm bg-secondary p-4 text-secondary-foreground">
          <Badge variant="secondary">{reviewTargetLabel(comment.target)}</Badge>
          {comment.quote ? (
            <blockquote className="whitespace-pre-wrap break-words border-primary/40 border-l-2 pl-3 text-muted-foreground text-sm">
              {comment.quote}
            </blockquote>
          ) : null}
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {comment.body}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1">
          <Badge size="status" variant={resolved ? "draft" : "review"}>
            <StatusIcon aria-hidden="true">
              <title>Comment status</title>
            </StatusIcon>
            <span>{resolved ? "Resolved" : "Open"}</span>
          </Badge>
          {comment.requestsChanges ? (
            <Badge size="status" variant="review">
              <span>Changes requested</span>
            </Badge>
          ) : null}
          {comment.blocksSubmit ? (
            <span className="text-muted-foreground text-xs">
              Resolve before submitting
            </span>
          ) : null}
          {resolved ? (
            <span className="text-muted-foreground text-xs">
              by {comment.resolvedBy?.name ?? "Deleted account"}
            </span>
          ) : null}
          {canComment ? (
            <div className="ml-auto flex items-center gap-2">
              <Button
                aria-label={resolved ? "Reopen" : "Resolve"}
                disabled={pending}
                onClick={() => onResolve(comment.id, !resolved)}
                size="icon-sm"
                title={resolved ? "Reopen comment" : "Resolve comment"}
                type="button"
                variant="ghost"
              >
                <ActionIcon aria-hidden="true" data-icon="inline-start">
                  <title>Change comment status</title>
                </ActionIcon>
              </Button>
              {comment.mine ? (
                <DeleteComment
                  onDelete={() => onDelete(comment.id)}
                  pending={pending}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function DeleteComment({
  pending,
  onDelete,
}: {
  pending: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!deleting) {
          setConfirming(open);
          setError("");
        }
      }}
      open={confirming}
    >
      <AlertDialogTrigger asChild>
        <Button
          aria-label="Delete"
          disabled={pending || deleting}
          size="icon-sm"
          title="Delete comment"
          type="button"
          variant="destructive"
        >
          <Trash2 aria-hidden="true" data-icon="inline-start">
            <title>Delete comment</title>
          </Trash2>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your comment?</AlertDialogTitle>
          <AlertDialogDescription>
            Your feedback and its quoted passage will be permanently removed.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel
            className={`${buttonVariants({ variant: "secondary" })} border-0`}
            disabled={deleting}
            type="button"
          >
            Keep comment
          </AlertDialogCancel>
          <Button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              setError("");
              try {
                await onDelete();
                setConfirming(false);
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Couldn’t delete the comment. Try again."
                );
              } finally {
                setDeleting(false);
              }
            }}
            type="button"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" data-icon="inline-start">
              <title>Delete comment</title>
            </Trash2>
            {deleting ? "Deleting…" : "Delete comment"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
