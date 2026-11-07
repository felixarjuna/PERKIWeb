"use client";

import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  dayLabel,
  dueLabel,
  extensionsLeftLabel,
  inLineLabel,
  lentLabel,
  MAX_EXTENSIONS,
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type Mine = RouterOutputs["library"]["mine"];
type Held = Mine["holding"][number];
type Waiting = Mine["queue"][number];
type Lent = RouterOutputs["library"]["myLentBooks"][number];

const onDay = (at: Date) =>
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

/** A book the member waits for: their place, or the hold that's theirs. */
function WaitingBook({
  book,
  onLeave,
  leaving,
}: {
  book: Waiting;
  onLeave: () => void;
  leaving: boolean;
}) {
  return (
    <li className="rounded-xl bg-card p-4 sm:p-6">
      <h3 className="type-subheading break-words">{book.title}</h3>
      <p className="type-body-sm mt-1 text-muted-foreground">{book.author}</p>
      {book.holdEndsOn ? (
        <>
          <p className="type-body mt-3 tabular-nums">
            Reserved for you · until {dayLabel(book.holdEndsOn)}
          </p>
          <p className="type-caption text-muted-foreground">
            It's back on the shelf. Tap Borrow there with the book in hand.
          </p>
        </>
      ) : (
        <p className="type-body mt-3 tabular-nums">
          {book.position ? inLineLabel(book.position) : "In line"}
        </p>
      )}
      <Button
        aria-label={`Leave the queue for ${book.title}`}
        className="mt-4"
        disabled={leaving}
        onClick={onLeave}
        size="sm"
        type="button"
        variant="ghost"
      >
        Leave queue
      </Button>
    </li>
  );
}

/** A book the member lends: where it is now, and who borrowed it before. */
function LentBook({ book, today }: { book: Lent; today: string }) {
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
        {lentLabel(book, today)}
      </p>
      {book.loans.length > 0 ? (
        <details className="mt-3">
          <summary className="type-body-sm cursor-pointer text-muted-foreground">
            Lent {book.loans.length}{" "}
            {book.loans.length === 1 ? "time" : "times"}
          </summary>
          <ul className="mt-2 space-y-1">
            {book.loans.map((loan) => (
              <li
                className="type-body-sm tabular-nums"
                key={`${loan.borrower}-${loan.borrowedAt.toISOString()}`}
              >
                {loan.borrower}
                <span className="text-muted-foreground">
                  {" "}
                  · {onDay(loan.borrowedAt)}
                  {loan.returnedAt
                    ? ` to ${onDay(loan.returnedAt)}`
                    : ", has it now"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

function Subsection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 className="type-eyebrow text-muted-foreground" id={id}>
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * The member's corner of `/library`: what they hold and until when, what
 * they wait for, the books they lend, and what they've given back. Hidden
 * until there's something in it.
 */
export default function MyBooks() {
  const mine = api.library.mine.useQuery();
  const lent = api.library.myLentBooks.useQuery();
  const utils = api.useUtils();
  const extend = api.library.extend.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async ({ dueOn }) => {
      toast.success(`Extended. Due ${dayLabel(dueOn)}`);
      await utils.library.invalidate();
    },
  });
  const leave = api.library.leaveQueue.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("You left the queue");
      await utils.library.invalidate();
    },
  });
  const { data } = mine;
  const lending = lent.data ?? [];
  if (
    !data ||
    (data.holding.length === 0 &&
      data.past.length === 0 &&
      data.queue.length === 0 &&
      lending.length === 0)
  ) {
    return null;
  }
  const today = localDay(new Date());
  return (
    <section aria-labelledby="my-books" className="space-y-6">
      <h2 className="type-heading scroll-mt-28" id="my-books">
        My books
      </h2>
      {data.holding.length > 0 ? (
        <ul aria-label="With you" className="space-y-3">
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
      {data.queue.length > 0 ? (
        <Subsection id="my-books-waiting" title="Waiting for">
          <ul className="space-y-3">
            {data.queue.map((book) => (
              <WaitingBook
                book={book}
                key={book.bookId}
                leaving={leave.isPending && leave.variables?.id === book.bookId}
                onLeave={() => leave.mutate({ id: book.bookId })}
              />
            ))}
          </ul>
        </Subsection>
      ) : null}
      {lending.length > 0 ? (
        <Subsection id="my-books-lent" title="Books you lend">
          <ul className="space-y-3">
            {lending.map((book) => (
              <LentBook book={book} key={book.id} today={today} />
            ))}
          </ul>
        </Subsection>
      ) : null}
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
                  · returned {onDay(loan.returnedAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
