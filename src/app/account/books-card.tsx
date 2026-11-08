import { BookOpen } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { dayLabel, isOverdue } from "~/lib/library";
import { cn } from "~/lib/utils";

/**
 * The card's data, or null when it can't be read (e.g. before
 * `deploy:migrate` adds the library tables), so the account page still
 * renders without the card. Nothing is logged: the error may name the member.
 */
export async function orNothing<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch {
    return null;
  }
}

/** "Mere Christianity, due 7 Dec", "2 books, next due 7 Dec", … */
export function booksSummary(
  holding: { dueOn: string; title: string }[],
  today: string
) {
  const [first] = holding;
  if (!first) {
    return "No library books with you right now";
  }
  const late = holding.filter((book) => isOverdue(book.dueOn, today)).length;
  if (late > 0) {
    return late === 1 && holding.length === 1
      ? `${first.title} is overdue`
      : `${late} of ${holding.length} books overdue`;
  }
  return holding.length === 1
    ? `${first.title}, due ${dayLabel(first.dueOn)}`
    : `${holding.length} books, next due ${dayLabel(first.dueOn)}`;
}

/** The member's library books, linking to My books on `/library`. */
export default function BooksCard({
  holding,
  today,
}: {
  holding: { dueOn: string; title: string }[];
  today: string;
}) {
  return (
    <section className="flex items-center gap-3 rounded-xl bg-card p-4 sm:p-6">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <BookOpen aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="type-body">My books</h2>
        <p className="type-body-sm text-muted-foreground">
          {booksSummary(holding, today)}
        </p>
      </div>
      <Link
        aria-label="See your library books"
        className={cn(
          buttonVariants({ size: "sm", variant: "secondary" }),
          "shrink-0"
        )}
        href="/library#my-books"
      >
        See all
      </Link>
    </section>
  );
}
