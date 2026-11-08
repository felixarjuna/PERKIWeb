"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ArrowDownUp, BookOpen, ListFilter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { AdminSearch } from "~/components/admin/admin-controls";
import Loader from "~/components/loader";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import {
  borrowableBy,
  inLineLabel,
  LIBRARY_SHOWS,
  LIBRARY_SORTS,
  type LibraryFilters,
  type LibraryShow,
  type LibrarySort,
  libraryFiltersFrom,
  NO_LIBRARY_FILTERS,
  OFFERED_HINT,
  SHOW_LABELS,
  SORT_LABELS,
} from "~/lib/library";
import { api, type RouterOutputs } from "~/trpc/react";
import { BookStateBadge } from "./book-state-badge";
import { BorrowDialog } from "./borrow-dialog";
import { BookByline } from "./language";
import MyBooks from "./my-books";
import { OfferBook } from "./offer-dialog";

type Book = RouterOutputs["library"]["list"][number];

/**
 * The filters, kept in `?q=`, `?show=` and `?sort=` so a search can be shared
 * or reloaded. Writes replace the history entry, so typing doesn't fill the
 * back button.
 */
function useLibraryFilters() {
  const params = useSearchParams();
  const [filters, setFilters] = React.useState(() =>
    libraryFiltersFrom(params)
  );
  const update = (next: LibraryFilters) => {
    setFilters(next);
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== NO_LIBRARY_FILTERS[key as keyof LibraryFilters]) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
    window.history.replaceState(null, "", url);
  };
  return [filters, update] as const;
}

/** Search, available/borrowed and sort, laid out like the gathering filters. */
export function LibraryFiltersBar({
  filters,
  onChange,
}: {
  filters: LibraryFilters;
  onChange: (next: LibraryFilters) => void;
}) {
  return (
    <search className="flex flex-col gap-3 sm:flex-row">
      <AdminSearch
        className="sm:flex-1"
        id="library-search"
        label="Search books"
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
        placeholder="Search titles and authors"
        value={filters.q}
      />
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          onValueChange={(value) =>
            onChange({ ...filters, show: value as LibraryShow })
          }
          value={filters.show}
        >
          <SelectTrigger
            aria-label="Show"
            className="min-w-0 sm:w-40"
            variant="filter"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ListFilter aria-hidden="true" className="size-3.5 shrink-0" />
              <SelectValue className="truncate" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LIBRARY_SHOWS.map((show) => (
                <SelectItem key={show} value={show}>
                  {SHOW_LABELS[show]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) =>
            onChange({ ...filters, sort: value as LibrarySort })
          }
          value={filters.sort}
        >
          <SelectTrigger
            aria-label="Sort by"
            className="min-w-0 sm:w-44"
            variant="filter"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ArrowDownUp aria-hidden="true" className="size-3.5 shrink-0" />
              <SelectValue className="truncate" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LIBRARY_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </search>
  );
}

/** The line under a book's details: your place in line, or why it waits. */
function bookHint(book: Book) {
  const { state } = book;
  if (state.kind === "offered") {
    return state.mine ? OFFERED_HINT : "Not on the shelf yet.";
  }
  if (state.kind === "reserved" && state.mine && state.holdEndsOn) {
    return "Tap Borrow at the shelf with the book in hand.";
  }
  return state.position ? inLineLabel(state.position) : null;
}

/** Whether a member can queue for the book: someone else has it. */
const queueable = (book: Book) =>
  book.state.kind === "borrowed"
    ? !book.state.mine
    : book.state.kind === "reserved" && !book.state.mine;

export function BookCard({
  book,
  onBorrow,
  onJoin,
  onLeave,
  pending = false,
}: {
  book: Book;
  onBorrow?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  pending?: boolean;
}) {
  const hint = bookHint(book);
  const inLine =
    book.state.position !== null ||
    (book.state.kind === "reserved" && book.state.mine);
  const borrow = Boolean(onBorrow) && borrowableBy(book.state);
  const joinable = Boolean(onJoin) && queueable(book) && !inLine;
  const leavable = Boolean(onLeave) && inLine;
  return (
    <article className="rounded-xl bg-card p-4 sm:p-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h2 className="type-subheading break-words">{book.title}</h2>
          <BookByline
            author={book.author}
            category={book.category}
            language={book.language}
            publisher={book.publisher}
          />
        </div>
        <BookStateBadge className="sm:mt-0.5" state={book.state} />
      </div>
      {book.description ? (
        <p className="type-body-sm mt-3 line-clamp-3 text-muted-foreground">
          {book.description}
        </p>
      ) : null}
      {hint ? <p className="type-body-sm mt-3 tabular-nums">{hint}</p> : null}
      {borrow || joinable || leavable ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {borrow ? (
            <Button
              aria-label={`Borrow ${book.title}`}
              onClick={onBorrow}
              size="sm"
              type="button"
            >
              Borrow
            </Button>
          ) : null}
          {joinable ? (
            <Button
              aria-label={`Join the queue for ${book.title}`}
              disabled={pending}
              onClick={onJoin}
              size="sm"
              type="button"
              variant="secondary"
            >
              Join queue
            </Button>
          ) : null}
          {leavable ? (
            <Button
              aria-label={`Leave the queue for ${book.title}`}
              disabled={pending}
              onClick={onLeave}
              size="sm"
              type="button"
              variant="ghost"
            >
              Leave queue
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/** Why the list is empty: nothing on the shelf yet, or nothing matches. */
export function EmptyLibrary({
  filters,
  onClear,
}: {
  filters: LibraryFilters;
  onClear: () => void;
}) {
  const q = filters.q.trim();
  if (!q && filters.show === "all") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-10 text-center sm:px-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <BookOpen aria-hidden="true" className="size-5" />
        </span>
        <p className="type-subheading">The shelf is empty for now</p>
        <p className="type-body-sm max-w-sm text-muted-foreground">
          The librarian adds books as they arrive at PERKI. Check back soon.
        </p>
      </div>
    );
  }
  const kind = { all: "", available: "available ", borrowed: "borrowed " }[
    filters.show
  ];
  return (
    <div className="rounded-xl bg-card p-4 sm:p-6">
      <p className="type-body text-muted-foreground">
        No {kind}books{q ? ` match “${q}”` : ""}.
      </p>
      <Button
        className="mt-3"
        onClick={onClear}
        size="sm"
        type="button"
        variant="secondary"
      >
        Clear filters
      </Button>
    </div>
  );
}

const countLabel = (count: number) =>
  `${count} ${count === 1 ? "book" : "books"}`;

/** Every book in the library, searchable and sortable, with its state. */
export default function LibraryCatalog() {
  const [filters, setFilters] = useLibraryFilters();
  const [borrowing, setBorrowing] = React.useState<Book | null>(null);
  const utils = api.useUtils();
  const onError = (error: { message: string }) => toast.error(error.message);
  const join = api.library.joinQueue.useMutation({
    onError,
    onSuccess: async ({ position }) => {
      toast.success(
        position ? `You're ${inLineLabel(position)}` : "You're in line"
      );
      await utils.library.invalidate();
    },
  });
  const leave = api.library.leaveQueue.useMutation({
    onError,
    onSuccess: async () => {
      toast.success("You left the queue");
      await utils.library.invalidate();
    },
  });
  // Search runs on the server once typing pauses.
  const q = useDebouncedValue(filters.q);
  const books = api.library.list.useQuery(
    { q: q.trim() || undefined, show: filters.show, sort: filters.sort },
    { placeholderData: keepPreviousData }
  );

  if (books.data === undefined) {
    return <Loader className="mt-8" message="Loading the library…" />;
  }

  return (
    <div className="space-y-8">
      <MyBooks />
      <div className="space-y-4">
        <LibraryFiltersBar filters={filters} onChange={setFilters} />
        <div className="flex items-center justify-between gap-3">
          {/* Always mounted so screen readers hear the count. */}
          <p
            className="type-caption text-muted-foreground tabular-nums"
            role="status"
          >
            {books.data.length > 0 ? countLabel(books.data.length) : ""}
          </p>
          <OfferBook />
        </div>
        {books.data.length === 0 ? (
          <div role="status">
            <EmptyLibrary
              filters={{ ...filters, q }}
              onClear={() => setFilters(NO_LIBRARY_FILTERS)}
            />
          </div>
        ) : null}
        {books.data.length > 0 ? (
          <ul aria-busy={books.isPlaceholderData} className="space-y-3">
            {books.data.map((book) => (
              <li key={book.id}>
                <BookCard
                  book={book}
                  onBorrow={() => setBorrowing(book)}
                  onJoin={() => join.mutate({ id: book.id })}
                  onLeave={() => leave.mutate({ id: book.id })}
                  pending={
                    (join.isPending && join.variables?.id === book.id) ||
                    (leave.isPending && leave.variables?.id === book.id)
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <BorrowDialog book={borrowing} onClose={() => setBorrowing(null)} />
    </div>
  );
}
