"use client";

import { DateTime } from "luxon";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  dayLabel,
  dueOnFrom,
  extendedDueOn,
  LOAN_DAYS,
  MAX_LOAN_NOTE,
} from "~/lib/library";
import { localDay } from "~/lib/schedule-team";
import { api } from "~/trpc/react";
import { accountName, MemberPicker } from "../member-picker";
import type { ShelfBook } from "./book-dialog";

const toDate = (day: string) => DateTime.fromISO(day).toJSDate();
const toDay = (date: Date) => DateTime.fromJSDate(date).toISODate() ?? "";
const longDay = (day: string) =>
  DateTime.fromISO(day).toFormat("cccc, d LLLL yyyy");

/** Lends a book to a member picked by name, e.g. one without a phone. */
export function LendDialog({
  book,
  onClose,
}: {
  book: ShelfBook | null;
  onClose: () => void;
}) {
  const [userId, setUserId] = React.useState("");
  React.useEffect(() => {
    if (book) {
      setUserId("");
    }
  }, [book]);
  const accounts = api.people.accounts.useQuery(undefined, {
    enabled: book !== null,
  });
  const utils = api.useUtils();
  const lend = api.library.lend.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async ({ dueOn }) => {
      const name = accounts.data?.find((account) => account.id === userId);
      toast.success(
        `Lent to ${name ? accountName(name) : "the member"} until ${dayLabel(dueOn)}`
      );
      onClose();
      await utils.library.invalidate();
    },
  });
  const today = localDay(new Date());
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={book !== null}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lend “{book?.title}”</DialogTitle>
          <DialogDescription>
            For a member who can't tap Borrow themselves. It's due{" "}
            {dayLabel(dueOnFrom(today))}, {LOAN_DAYS} days from today.
          </DialogDescription>
        </DialogHeader>
        <MemberPicker
          accounts={accounts.data}
          onChange={setUserId}
          pending={accounts.isPending}
          value={userId}
        />
        <DialogFooter>
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={!userId || lend.isPending}
            onClick={() => {
              if (book) {
                lend.mutate({ id: book.id, userId });
              }
            }}
            type="button"
          >
            {lend.isPending ? "Lending…" : "Lend"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Another loan period on top of the current due date, never in the past. */
const suggestedDueOn = (book: ShelfBook | null, today: string) => {
  const next = book?.dueOn ? extendedDueOn(book.dueOn) : today;
  return next < today ? dueOnFrom(today) : next;
};

/**
 * Sets an open loan's due date directly, past the members' two extensions,
 * with an optional note for the history.
 */
export function DueDateDialog({
  book,
  onClose,
}: {
  book: ShelfBook | null;
  onClose: () => void;
}) {
  const today = localDay(new Date());
  const [day, setDay] = React.useState(() => suggestedDueOn(book, today));
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (book) {
      setDay(suggestedDueOn(book, today));
      setNote("");
    }
  }, [book, today]);
  const utils = api.useUtils();
  const setDueOn = api.library.setDueOn.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async ({ dueOn }) => {
      toast.success(`Due ${dayLabel(dueOn)} now`);
      onClose();
      await utils.library.invalidate();
    },
  });
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={book !== null}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend “{book?.title}”</DialogTitle>
          <DialogDescription>
            {book?.holder ?? "The member"} has it
            {book?.dueOn ? ` until ${dayLabel(book.dueOn)}` : ""}. Pick the new
            due date; it can go past the two extensions members get.
          </DialogDescription>
        </DialogHeader>
        <div className="grid justify-center">
          <Calendar
            defaultMonth={toDate(day)}
            disabled={(date) => toDay(date) < today}
            mode="single"
            onSelect={(picked) => {
              if (picked) {
                setDay(toDay(picked));
              }
            }}
            required
            selected={toDate(day)}
          />
        </div>
        <p className="type-body-sm text-center text-muted-foreground">
          Due {longDay(day)}
        </p>
        <div className="grid gap-2">
          <Label htmlFor="loan-note">Note (optional)</Label>
          <Textarea
            id="loan-note"
            maxLength={MAX_LOAN_NOTE}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why it's longer, for the history"
            rows={2}
            value={note}
          />
        </div>
        <DialogFooter>
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={setDueOn.isPending}
            onClick={() => {
              if (book) {
                setDueOn.mutate({ dueOn: day, id: book.id, note });
              }
            }}
            type="button"
          >
            {setDueOn.isPending ? "Saving…" : "Set due date"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
