"use client";

import { CircleDot, MessageSquareWarning, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { COMMENT_MAX_LENGTH } from "~/lib/takeaway-comments";
import { api } from "~/trpc/react";

/** How many blocking comments the dialog quotes before summing up the rest. */
const SHOWN_BLOCKERS = 3;

interface MoveDialogProps {
  readonly name: string;
  readonly onCancel: () => void;
  readonly onCloseAutoFocus: (event: Event) => void;
  readonly open: boolean;
  readonly pending: boolean;
}

/**
 * Confirms submitting a draft to mita. Reviewers' open comments block it
 * (the server refuses too); the dialog names them and links to the thread.
 */
export function SubmitDialog({
  name,
  onCancel,
  onCloseAutoFocus,
  onSubmit,
  open,
  pending,
  takeawayId,
}: MoveDialogProps & {
  readonly onSubmit: () => void;
  readonly takeawayId: number;
}) {
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { enabled: open, retry: false, staleTime: 0 }
  );
  const blockers =
    thread.data?.comments.filter((comment) => comment.blocksSubmit) ?? [];
  const blocked = blockers.length > 0;
  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
      open={open}
    >
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit “{name}” to mita?</AlertDialogTitle>
          <AlertDialogDescription>
            The text is locked while mita checks it. Mita publishes it, or sends
            it back to draft with a note.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {thread.isPending ? (
          <p className="type-body-sm text-muted-foreground" role="status">
            Checking open comments…
          </p>
        ) : null}
        {blocked ? (
          <div
            className="flex flex-col gap-3 rounded-xl bg-secondary p-4"
            data-slot="submit-blockers"
            role="alert"
          >
            <p className="type-body-sm font-medium">
              {blockers.length === 1
                ? "1 open comment blocks submitting."
                : `${blockers.length} open comments block submitting.`}{" "}
              Resolve {blockers.length === 1 ? "it" : "them"} first.
            </p>
            <ul className="flex flex-col gap-2">
              {blockers.slice(0, SHOWN_BLOCKERS).map((comment) => (
                <li className="flex items-start gap-2" key={comment.id}>
                  <CircleDot
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  >
                    <title>Open comment</title>
                  </CircleDot>
                  <p className="type-body-sm min-w-0 break-words">
                    <span className="font-medium">
                      {comment.author?.name ?? "Deleted account"}:
                    </span>{" "}
                    <span className="line-clamp-2 text-muted-foreground">
                      {comment.body}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            {blockers.length > SHOWN_BLOCKERS ? (
              <p className="type-caption text-muted-foreground">
                and {blockers.length - SHOWN_BLOCKERS} more
              </p>
            ) : null}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep editing</AlertDialogCancel>
          {blocked ? (
            <Link
              className={buttonVariants()}
              href={`/admin/takeaways/${takeawayId}`}
            >
              Open review comments
            </Link>
          ) : (
            <Button
              disabled={pending || thread.isPending}
              onClick={onSubmit}
              type="button"
            >
              <Send aria-hidden="true" data-icon="inline-start">
                <title>Submit to mita</title>
              </Send>
              {pending ? "Submitting…" : "Submit to mita"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Mita's request for changes: a note for the writer is required. It goes
 * into the review thread and stays above the text until the writer
 * resolves it.
 */
export function RequestChangesDialog({
  name,
  onCancel,
  onCloseAutoFocus,
  onRequest,
  open,
  pending,
}: MoveDialogProps & { readonly onRequest: (note: string) => void }) {
  const noteId = useId();
  const hintId = useId();
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const empty = note.trim() === "";
  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (!next) {
          setNote("");
          setTried(false);
          onCancel();
        }
      }}
      open={open}
    >
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            setTried(true);
            if (!empty) {
              onRequest(note.trim());
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Request changes to “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              It goes back to draft. The writer sees your note above the text
              until they resolve it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={noteId}>What should change?</Label>
            <Textarea
              aria-describedby={hintId}
              aria-invalid={tried && empty}
              aria-required="true"
              autoFocus
              id={noteId}
              maxLength={COMMENT_MAX_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              placeholder="For example: shorten the second point and add the verse reference."
              rows={4}
              value={note}
            />
            <p
              className={
                tried && empty
                  ? "type-caption text-destructive-text"
                  : "type-caption text-muted-foreground"
              }
              id={hintId}
            >
              {tried && empty
                ? "Add a note so the writer knows what to fix."
                : "Required. Be specific: the writer works from this note."}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Keep it submitted
            </AlertDialogCancel>
            <Button disabled={pending} type="submit">
              <Undo2 aria-hidden="true" data-icon="inline-start">
                <title>Request changes</title>
              </Undo2>
              {pending ? "Sending…" : "Request changes"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Mita's latest open request for changes, shown above the text so the
 * writer starts from it. Resolving it (here or in the thread) clears it.
 */
export function ChangesRequested({ takeawayId }: { takeawayId: number }) {
  const utils = api.useUtils();
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  const resolve = api.takeawayComments.setResolved.useMutation({
    onSuccess: () => utils.takeawayComments.list.invalidate({ takeawayId }),
  });
  const request = thread.data?.comments.findLast(
    (comment) => comment.requestsChanges && !comment.resolvedAt
  );
  if (!request) {
    return null;
  }
  const from = request.author?.name ?? "Mita";
  return (
    <section
      aria-label="Changes requested"
      className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:p-6"
      data-slot="changes-requested"
    >
      <div className="flex items-center gap-2">
        <MessageSquareWarning aria-hidden="true" className="size-4 shrink-0">
          <title>Changes requested</title>
        </MessageSquareWarning>
        <p className="type-eyebrow">Changes requested</p>
      </div>
      <p className="type-body whitespace-pre-wrap break-words">
        {request.body}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="type-caption text-muted-foreground">
          From {from} ·{" "}
          {request.createdAt.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            timeZone: "Europe/Berlin",
          })}
          . Resolve it once it’s fixed, then submit again.
        </p>
        {thread.data?.canComment ? (
          <Button
            className="shrink-0"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate({ id: request.id, resolved: true })}
            type="button"
            variant="secondary"
          >
            {resolve.isPending ? "Resolving…" : "Mark as resolved"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
