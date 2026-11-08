"use client";

import { DateTime } from "luxon";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  dayLabel,
  dueLabel,
  extensionsLeftLabel,
  MAX_EXTENSIONS,
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type Mine = RouterOutputs["library"]["mine"];
type Held = Mine["holding"][number];

const returnedOn = (at: Date) =>
  DateTime.fromJSDate(at).setZone("Europe/Berlin").toFormat("d LLL yyyy");

/** One book the member has: when it's due, and Extend while they may. */
export function HeldBook({
  book,
  today,
  onExtend,
  extending,
}: {
  book: Held;
  today: string;
  onExtend: () => void;
  extending: boolean;
}) {
  const hintId = `extend-${book.loanId}`;
  return (
    <li className="rounded-xl bg-card p-4 sm:p-6">
      <h3 className="type-subheading break-words">{book.title}</h3>
      <p className="type-body-sm mt-1 text-muted-foreground">{book.author}</p>
      <p
        className={cn(
          "type-body mt-3 tabular-nums",
          book.overdue && "text-destructive-text"
        )}
      >
        {dueLabel(book.dueOn, today)}
      </p>
      <p className="type-caption text-muted-foreground">
        Return it to the librarian.
        {book.extensions < MAX_EXTENSIONS && !book.overdue
          ? ` ${extensionsLeftLabel(book.extensions)}.`
          : ""}
      </p>
      <div className="mt-4 flex flex-col items-start gap-2">
        <Button
          aria-describedby={book.extendRefusal ? hintId : undefined}
          aria-label={`Extend ${book.title}`}
          disabled={book.extendRefusal !== null || extending}
          onClick={onExtend}
          size="sm"
          type="button"
          variant="secondary"
        >
          Extend 30 days
        </Button>
        {book.extendRefusal ? (
          <p className="type-caption text-muted-foreground" id={hintId}>
            {book.extendRefusal}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The member's own loans at the top of `/library`: what they hold, due when,
 * and what they've given back. Hidden until they've borrowed something.
 */
export default function MyBooks() {
  const mine = api.library.mine.useQuery();
  const utils = api.useUtils();
  const extend = api.library.extend.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async ({ dueOn }) => {
      toast.success(`Extended. Due ${dayLabel(dueOn)}`);
      await utils.library.invalidate();
    },
  });
  const { data } = mine;
  if (!data || (data.holding.length === 0 && data.past.length === 0)) {
    return null;
  }
  const today = localDay(new Date());
  return (
    <section aria-labelledby="my-books" className="space-y-3">
      <h2 className="type-heading scroll-mt-28" id="my-books">
        My books
      </h2>
      {data.holding.length > 0 ? (
        <ul className="space-y-3">
          {data.holding.map((book) => (
            <HeldBook
              book={book}
              extending={
                extend.isPending && extend.variables?.loanId === book.loanId
              }
              key={book.loanId}
              onExtend={() => extend.mutate({ loanId: book.loanId })}
              today={today}
            />
          ))}
        </ul>
      ) : (
        <p className="type-body-sm rounded-xl bg-card p-4 text-muted-foreground sm:p-6">
          You have no books from the library right now.
        </p>
      )}
      {data.past.length > 0 ? (
        <details className="rounded-xl bg-card p-4 sm:p-6">
          <summary className="type-body-sm cursor-pointer">
            Past borrows ({data.past.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {data.past.map((loan) => (
              <li
                className="type-body-sm"
                key={`${loan.title}-${loan.returnedAt.toISOString()}`}
              >
                {loan.title}
                <span className="text-muted-foreground">
                  {" "}
                  · returned {returnedOn(loan.returnedAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
