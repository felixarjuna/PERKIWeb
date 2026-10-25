"use client";

import { format } from "date-fns";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { servingRoleLabels } from "~/lib/serving-roles";
import { MAX_UNAVAILABLE_NOTE, rangeLabel } from "~/lib/unavailability";
import { api, type RouterOutputs } from "~/trpc/react";

export type UnavailableRange =
  RouterOutputs["unavailability"]["mine"]["ranges"][number];
type Assigned = RouterOutputs["unavailability"]["add"]["assigned"];

/** Gatherings happen in Aachen, so slot times read in its zone. */
const ZONE = "Europe/Berlin";

const dayOf = (date: Date) => format(date, "yyyy-MM-dd");

/** The slots the member still holds on the days they just marked. */
export const stillServing = (assigned: Assigned) =>
  assigned
    .map(
      (slot) =>
        `${servingRoleLabels[slot.role].toLowerCase()} on ${DateTime.fromJSDate(
          slot.date
        )
          .setZone(ZONE)
          .toFormat("ccc d LLL")}`
    )
    .join(", ");

/** Picks one day or a stretch of days, with an optional note for mita. */
function MarkDays() {
  const router = useRouter();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState("");
  const add = api.unavailability.add.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: (result) => {
      setOpen(false);
      setRange(undefined);
      setNote("");
      toast.success(
        "Marked. Mita won't plan you on those days.",
        result.assigned.length > 0
          ? {
              description: `You're still on the schedule as ${stillServing(
                result.assigned
              )}. Mita see a warning there and will sort it out with you.`,
            }
          : undefined
      );
      router.refresh();
    },
  });
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="w-fit" type="button" variant="secondary">
          <Plus aria-hidden="true" className="size-4" />
          Mark days
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!range?.from) {
              return;
            }
            add.mutate({
              endsOn: dayOf(range.to ?? range.from),
              note: note.trim() || undefined,
              startsOn: dayOf(range.from),
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>Days you can't serve</DialogTitle>
            <DialogDescription>
              Tap one day, or a first and a last day for a stretch.
            </DialogDescription>
          </DialogHeader>
          <Calendar
            className="mx-auto rounded-lg bg-secondary"
            disabled={{ before: new Date() }}
            mode="range"
            onSelect={setRange}
            selected={range}
          />
          <div className="grid gap-2">
            <Label htmlFor={noteId}>Note for mita (optional)</Label>
            <Textarea
              id={noteId}
              maxLength={MAX_UNAVAILABLE_NOTE}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Visiting family"
              value={note}
            />
            <p className="type-caption text-muted-foreground">
              Only mita see your note.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={!range?.from || add.isPending} type="submit">
              {add.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The days the member marked as ones they can't serve. Mita see them when
 * they plan, and open slots on them aren't offered. Only the member adds or
 * removes them.
 */
export default function UnavailableDates({
  ranges,
}: {
  ranges: UnavailableRange[];
}) {
  const id = useId();
  const router = useRouter();
  const remove = api.unavailability.remove.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Removed. You can be planned on those days again.");
      router.refresh();
    },
  });
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="space-y-1">
        <h2 className="type-heading" id={id}>
          Days you can't serve
        </h2>
        <p className="type-body-sm text-pretty text-muted-foreground">
          Mita see these when they plan, and open slots on them aren't offered
          to you.
        </p>
      </div>
      {ranges.length === 0 ? null : (
        <ul aria-label="Days you can't serve" className="space-y-3">
          {ranges.map((range) => {
            const label = rangeLabel(range);
            return (
              <li
                className="flex items-start justify-between gap-3 rounded-xl bg-card p-4 sm:p-6"
                key={range.id}
              >
                <div className="flex min-w-0 gap-3">
                  <CalendarOff
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="type-body-sm tabular-nums">{label}</p>
                    {range.note ? (
                      <p className="type-caption mt-1 break-words text-muted-foreground">
                        {range.note}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  aria-label={`Remove ${label}`}
                  className="-my-1.5 shrink-0"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: range.id })}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <MarkDays />
    </section>
  );
}
