"use client";

import { DateTime } from "luxon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { api } from "~/trpc/react";
import { QueryMessage } from "../admin-controls";
import { historyLine } from "./shelf-model";

const when = (at: Date) =>
  DateTime.fromJSDate(at)
    .setZone("Europe/Berlin")
    .toFormat("d LLL yyyy, HH:mm");

/** Everything that happened to one book, newest first. */
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
            History of this book, newest first.
          </SheetDescription>
        </SheetHeader>
        {history.isError ? (
          <QueryMessage error onRetry={() => history.refetch()} />
        ) : null}
        {history.isPending && !history.isError ? (
          <QueryMessage>Loading history…</QueryMessage>
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
                    <time dateTime={event.at.toISOString()}>
                      {when(event.at)}
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
