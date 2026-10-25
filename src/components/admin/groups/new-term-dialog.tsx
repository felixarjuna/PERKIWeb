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
import { mayStartTermOn, nextTermStart } from "~/lib/group-terms";
import { api } from "~/trpc/react";

const toDate = (day: string) => DateTime.fromISO(day).toJSDate();
const toDay = (date: Date) => DateTime.fromJSDate(date).toISODate() ?? "";

/**
 * Picks the first day of a new term (the first of next month by default) and
 * starts it as a copy of the groups in force before that day.
 */
export function NewTermDialog({
  open,
  onOpenChange,
  onStarted,
  terms,
  today,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: (termId: number) => void;
  terms: { startsOn: string }[];
  today: string;
}) {
  const [day, setDay] = React.useState(() => nextTermStart(today));
  React.useEffect(() => {
    if (open) {
      setDay(nextTermStart(today));
    }
  }, [open, today]);
  const utils = api.useUtils();
  const start = api.groups.startTerm.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async ({ id }) => {
      await utils.groups.invalidate();
      onStarted(id);
      onOpenChange(false);
      toast.success(
        `New term starts on ${DateTime.fromISO(day).toFormat("d LLLL yyyy")}`
      );
    },
  });
  const refusal = mayStartTermOn(terms, day, today);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a new term</DialogTitle>
          <DialogDescription>
            The groups of the term before it are copied, so you can move people
            between groups before it begins. The Groups page and My duties
            switch to it on its first day.
          </DialogDescription>
        </DialogHeader>
        <div className="grid justify-center">
          <Calendar
            defaultMonth={toDate(day)}
            disabled={(date) =>
              mayStartTermOn(terms, toDay(date), today) !== null
            }
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
          {refusal ??
            `Starts on ${DateTime.fromISO(day).toFormat("cccc, d LLLL yyyy")}`}
        </p>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={refusal !== null || start.isPending}
            onClick={() => start.mutate({ startsOn: day })}
            type="button"
          >
            {start.isPending ? "Starting…" : "Start term"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
