"use client";

import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { dayLabel, inLineLabel } from "~/lib/library";
import { api, type RouterOutputs } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { historyLine, historyWhen } from "./shelf-model";

type QueueEntry = RouterOutputs["library"]["history"]["queue"][number];

const queueLine = (entry: QueueEntry) =>
  entry.status === "ready"
    ? `Reserved${entry.expiresOn ? ` until ${dayLabel(entry.expiresOn)}` : ""}`
    : inLineLabel(entry.position ?? 1);

/** Who's waiting for the book, each with Cancel for the librarian. */
function BookQueue({ queue }: { queue: QueueEntry[] }) {
  const utils = api.useUtils();
  const cancel = api.library.cancelReservation.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Reservation cancelled");
      await utils.library.invalidate();
    },
  });
  return (
    <section aria-labelledby="book-queue" className="space-y-3">
      <h3 className="type-eyebrow text-muted-foreground" id="book-queue">
        Queue ({queue.length})
      </h3>
      <ul className="space-y-2">
        {queue.map((entry) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2"
            key={entry.id}
          >
            <div className="min-w-0">
              <p className="type-body-sm break-words">{entry.name}</p>
              <p className="type-caption text-muted-foreground tabular-nums">
                {queueLine(entry)}
              </p>
            </div>
            <Button
              aria-label={`Cancel ${entry.name}'s reservation`}
              disabled={
                cancel.isPending && cancel.variables?.reservationId === entry.id
              }
              onClick={() => cancel.mutate({ reservationId: entry.id })}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Everything that happened to one book, newest first, and who waits for it. */
export function BookHistory({
  book,
  onClose,
}: {
  book: { id: number; title: string } | null;
  onClose: () => void;
}) {
  const history = api.library.history.useQuery(
    { id: book?.id ?? 0 },
    { enabled: book !== null }
  );
  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={book !== null}
    >
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto border-0 p-6 text-foreground sm:max-w-md">
        <SheetHeader className="pt-5 text-left">
          <SheetTitle className="type-heading">{book?.title}</SheetTitle>
          <SheetDescription>
            Who waits for this book, and its history, newest first.
          </SheetDescription>
        </SheetHeader>
        {history.isError ? (
          <QueryMessage error onRetry={() => history.refetch()} />
        ) : null}
        {history.isPending && !history.isError ? (
          <QueryMessage>Loading history…</QueryMessage>
        ) : null}
        {history.data && history.data.queue.length > 0 ? (
          <BookQueue queue={history.data.queue} />
        ) : null}
        {history.data ? (
          <ol aria-label="History" className="flex flex-col">
            {history.data.events.map((event) => {
              const line = historyLine(event);
              return (
                <li
                  className="relative border-secondary border-l-2 pb-5 pl-4 last:pb-0"
                  key={event.id}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-primary"
                  />
                  <p className="type-body-sm">{line.title}</p>
                  {line.detail ? (
                    <p className="type-caption text-muted-foreground">
                      {line.detail}
                    </p>
                  ) : null}
                  <p className="type-caption text-muted-foreground tabular-nums">
                    <time
                      dateTime={
                        event.details.precision === "month"
                          ? String(event.details.month)
                          : event.at.toISOString()
                      }
                    >
                      {historyWhen(event)}
                    </time>
                  </p>
                </li>
              );
            })}
          </ol>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
