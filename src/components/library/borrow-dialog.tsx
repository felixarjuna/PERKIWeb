"use client";

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
import { dayLabel, dueOnFrom, LOAN_DAYS } from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { api } from "~/trpc/react";

/** The confirmation copy, with the due date a loan started today gets. */
export const borrowCopy = (title: string, today: string) => ({
  description: `You have it until ${dayLabel(dueOnFrom(today))}, ${LOAN_DAYS} days. You can extend twice from My books. Bring it back to the librarian.`,
  title: `Borrow ${title}?`,
});

/**
 * Confirms a Borrow, tapped with the book in hand at the shelf. There's no
 * undo for the member: a wrong tap goes to the librarian.
 */
export function BorrowDialog({
  book,
  onClose,
}: {
  book: { id: number; title: string } | null;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const borrow = api.library.borrow.useMutation({
    onError: (error) => {
      toast.error(error.message);
      onClose();
    },
    onSuccess: async ({ dueOn }) => {
      toast.success(`Borrowed. Due ${dayLabel(dueOn)}`);
      onClose();
      await utils.library.invalidate();
    },
  });
  const copy = book ? borrowCopy(book.title, localDay(new Date())) : null;
  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={book !== null}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={borrow.isPending}
            onClick={(event) => {
              event.preventDefault();
              if (book) {
                borrow.mutate({ id: book.id });
              }
            }}
          >
            {borrow.isPending ? "Borrowing…" : "Borrow"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
