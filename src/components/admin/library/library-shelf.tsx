"use client";

import { keepPreviousData } from "@tanstack/react-query";
import {
  BookCheck,
  CalendarPlus,
  HandHelping,
  History,
  Pencil,
  Plus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import {
  SHELF_STATE_LABELS,
  SHELF_STATES,
  type ShelfState,
  shelfStateOf,
} from "~/lib/library";
import { api } from "~/trpc/react";
import { AdminSearch, AdminSelect, QueryMessage } from "../admin-controls";
import { BookDialog, type ShelfBook } from "./book-dialog";
import { BookHistory } from "./book-history";
import { DueDateDialog, LendDialog } from "./loan-dialogs";
import { shelfLabel, withdrawRefusal } from "./shelf-model";

const stateOptions = SHELF_STATES.map((state) => ({
  label: SHELF_STATE_LABELS[state],
  value: state === "shelf" ? "" : state,
}));

/** Writes a filter to the URL; Next.js syncs `history` into `useSearchParams`. */
function setParam(key: string, value: string, replace: boolean) {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  if (replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
}

const KIND_LABELS: Record<ShelfBook["kind"], string> = {
  available: "Available",
  borrowed: "Out",
  offered: "Offered",
  reserved: "Reserved",
  withdrawn: "Withdrawn",
};

function variantOf(book: ShelfBook): BadgeProps["variant"] {
  if (book.overdue) {
    return "destructive";
  }
  if (book.kind === "available") {
    return "published";
  }
  return book.kind === "reserved" ? "review" : "draft";
}

interface RowActions {
  onEdit: () => void;
  onExtend: () => void;
  onHistory: () => void;
  onLend: () => void;
  onRestore: () => void;
  onReturn: () => void;
  onWithdraw: () => void;
  restoring: boolean;
}

/** Mark returned and Extend for a book that's out; Lend for one on the shelf. */
function LendingActions({
  book,
  onExtend,
  onLend,
  onReturn,
}: { book: ShelfBook } & Pick<RowActions, "onExtend" | "onLend" | "onReturn">) {
  if (book.kind === "borrowed") {
    return (
      <>
        <Button
          aria-label={`Mark ${book.title} returned`}
          onClick={onReturn}
          size="sm"
          type="button"
        >
          <BookCheck aria-hidden="true" />
          Mark returned
        </Button>
        <Button
          aria-label={`Extend ${book.title}`}
          onClick={onExtend}
          size="sm"
          type="button"
          variant="secondary"
        >
          <CalendarPlus aria-hidden="true" />
          Extend
        </Button>
      </>
    );
  }
  if (book.kind === "available") {
    return (
      <Button
        aria-label={`Lend ${book.title}`}
        onClick={onLend}
        size="sm"
        type="button"
        variant="secondary"
      >
        <HandHelping aria-hidden="true" />
        Lend
      </Button>
    );
  }
  return null;
}

function ShelfRow({
  book,
  onEdit,
  onExtend,
  onHistory,
  onLend,
  onReturn,
  onWithdraw,
  onRestore,
  restoring,
}: { book: ShelfBook } & RowActions) {
  const cantWithdraw = withdrawRefusal(book);
  const hintId = `withdraw-${book.id}`;
  return (
    <li className="rounded-xl bg-card p-4 sm:p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h2 className="type-subheading break-words">{book.title}</h2>
          <p className="type-body-sm mt-1 text-muted-foreground">
            {book.author}
            {book.language ? ` · ${book.language}` : ""}
          </p>
          <p className="type-caption mt-1 text-muted-foreground">
            {[
              book.owner ? `Lent by ${book.owner.name}` : "PERKI's book",
              shelfLabel(book),
              book.kind === "borrowed" && book.extensions > 0
                ? `extended ${book.extensions}×`
                : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Badge size="status" variant={variantOf(book)}>
          <span>{book.overdue ? "Overdue" : KIND_LABELS[book.kind]}</span>
        </Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <LendingActions
          book={book}
          onExtend={onExtend}
          onLend={onLend}
          onReturn={onReturn}
        />
        <Button
          aria-label={`Edit ${book.title}`}
          onClick={onEdit}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button
          aria-label={`History of ${book.title}`}
          onClick={onHistory}
          size="sm"
          type="button"
          variant="secondary"
        >
          <History aria-hidden="true" />
          History
        </Button>
        {book.kind === "withdrawn" ? (
          <Button
            disabled={restoring}
            onClick={onRestore}
            size="sm"
            type="button"
            variant="ghost"
          >
            Bring back
          </Button>
        ) : (
          <Button
            aria-describedby={cantWithdraw ? hintId : undefined}
            disabled={cantWithdraw !== null}
            onClick={onWithdraw}
            size="sm"
            type="button"
            variant="ghost"
          >
            Withdraw
          </Button>
        )}
      </div>
      {cantWithdraw ? (
        <p className="type-caption mt-2 text-muted-foreground" id={hintId}>
          {cantWithdraw}
        </p>
      ) : null}
    </li>
  );
}

/** The librarian's shelf: every book, who lent and holds it, and its history. */
export default function LibraryShelf() {
  const params = useSearchParams();
  const state: ShelfState = shelfStateOf(params.get("state"));
  const [search, setSearch] = React.useState(() => params.get("q") ?? "");
  const q = useDebouncedValue(search).trim();
  const books = api.library.manage.useQuery(
    { q: q || undefined, state },
    { placeholderData: keepPreviousData }
  );
  const utils = api.useUtils();
  const [editing, setEditing] = React.useState<{
    book?: ShelfBook;
    open: boolean;
  }>({ open: false });
  const [history, setHistory] = React.useState<ShelfBook | null>(null);
  const [withdrawing, setWithdrawing] = React.useState<ShelfBook | null>(null);
  const [returning, setReturning] = React.useState<ShelfBook | null>(null);
  const [lending, setLending] = React.useState<ShelfBook | null>(null);
  const [extending, setExtending] = React.useState<ShelfBook | null>(null);

  const withdraw = api.library.withdraw.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success(`“${withdrawing?.title ?? "The book"}” withdrawn`);
      setWithdrawing(null);
      await utils.library.invalidate();
    },
  });
  const markReturned = api.library.markReturned.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success(`“${returning?.title ?? "The book"}” is back on the shelf`);
      setReturning(null);
      await utils.library.invalidate();
    },
  });
  const restore = api.library.restore.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Back in the library");
      await utils.library.invalidate();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <AdminSearch
          className="sm:flex-1"
          id="shelf-search"
          label="Search books"
          onChange={(event) => {
            setSearch(event.target.value);
            setParam("q", event.target.value, true);
          }}
          placeholder="Search titles and authors"
          value={search}
        />
        <div className="grid grid-cols-2 items-end gap-3 sm:flex">
          <AdminSelect
            className="sm:w-44"
            hideLabel
            id="shelf-state"
            label="Show"
            onChange={(value) => setParam("state", value, false)}
            options={stateOptions}
            value={state === "shelf" ? "" : state}
          />
          <Button onClick={() => setEditing({ open: true })} type="button">
            <Plus aria-hidden="true" />
            Add book
          </Button>
        </div>
      </div>

      {books.isError ? (
        <QueryMessage error onRetry={() => books.refetch()} />
      ) : null}
      {books.isPending ? <QueryMessage>Loading books…</QueryMessage> : null}
      {books.data ? (
        <>
          <p
            className="type-caption text-muted-foreground tabular-nums"
            role="status"
          >
            {books.data.length === 0
              ? `No books${q ? ` match “${q}”` : ""}${
                  state === "shelf"
                    ? " yet"
                    : ` in “${SHELF_STATE_LABELS[state]}”`
                }.`
              : `${books.data.length} ${books.data.length === 1 ? "book" : "books"}`}
          </p>
          {books.data.length > 0 ? (
            <ul aria-busy={books.isPlaceholderData} className="space-y-3">
              {books.data.map((book) => (
                <ShelfRow
                  book={book}
                  key={book.id}
                  onEdit={() => setEditing({ book, open: true })}
                  onExtend={() => setExtending(book)}
                  onHistory={() => setHistory(book)}
                  onLend={() => setLending(book)}
                  onRestore={() => restore.mutate({ id: book.id })}
                  onReturn={() => setReturning(book)}
                  onWithdraw={() => setWithdrawing(book)}
                  restoring={restore.isPending}
                />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <BookDialog
        book={editing.book}
        onOpenChange={(open) => setEditing((current) => ({ ...current, open }))}
        open={editing.open}
      />
      <BookHistory book={history} onClose={() => setHistory(null)} />
      <LendDialog book={lending} onClose={() => setLending(null)} />
      <DueDateDialog book={extending} onClose={() => setExtending(null)} />
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setReturning(null);
          }
        }}
        open={returning !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark “{returning?.title}” returned?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Only once the book is back on the shelf. This ends{" "}
              {returning?.holder ? `${returning.holder}'s` : "the"} loan and
              members can borrow it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={markReturned.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (returning) {
                  markReturned.mutate({ id: returning.id });
                }
              }}
            >
              Mark returned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setWithdrawing(null);
          }
        }}
        open={withdrawing !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Withdraw “{withdrawing?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              It leaves the members' list, for example when its owner asks for
              it back or it's lost. Its history stays, and you can bring it back
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={withdraw.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (withdrawing) {
                  withdraw.mutate({ id: withdrawing.id });
                }
              }}
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
