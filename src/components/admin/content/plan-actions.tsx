"use client";

import { CalendarCheck, LoaderCircle, Sparkles } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
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
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { monthLabel, monthOf } from "~/lib/months";
import type { PlanRow } from "~/lib/plan-grid";
import { api } from "~/trpc/react";
import { AdminSelect } from "../admin-controls";

const ZONE = "Europe/Berlin";

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

interface Range {
  from: string;
  through: string;
}

/** The months shown in the grid, as options, short enough for two side by side on a phone. */
const monthOptions = (from: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const month = DateTime.fromFormat(from, "yyyy-MM", { zone: ZONE }).plus({
      months: index,
    });
    return {
      label: month.toFormat("LLL yyyy"),
      value: month.toFormat("yyyy-MM"),
    };
  });

const inRange = (row: PlanRow, range: Range) => {
  const month = monthOf(row.schedule.date);
  return range.from <= month && month <= range.through;
};

/** "From" and "Through" months, kept in order. */
function RangeFields({
  id,
  options,
  range,
  onChange,
}: {
  id: string;
  options: { label: string; value: string }[];
  range: Range;
  onChange: (range: Range) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <AdminSelect
        id={`${id}-from`}
        label="From"
        onChange={(from) =>
          onChange({
            from,
            through: from > range.through ? from : range.through,
          })
        }
        options={options}
        value={range.from}
      />
      <AdminSelect
        id={`${id}-through`}
        label="Through"
        onChange={(through) =>
          onChange({
            from: through < range.from ? through : range.from,
            through,
          })
        }
        options={options}
        value={range.through}
      />
    </div>
  );
}

/** Starts at the first month shown that isn't over yet. */
function useRange(from: string, count: number) {
  const now = DateTime.now().setZone(ZONE).toFormat("yyyy-MM");
  const options = monthOptions(from, count);
  const first =
    options.find((option) => option.value >= now)?.value ??
    options.at(-1)?.value ??
    from;
  const [range, setRange] = useState<Range>({ from: first, through: first });
  // The grid moved: keep the range inside what it shows.
  const values = options.map((option) => option.value);
  const shown =
    values.includes(range.from) && values.includes(range.through)
      ? range
      : { from: first, through: first };
  return { options, range: shown, setRange };
}

/**
 * Generate (#112): fills the open slots of the drafts and regular days in a
 * range of months, or with "Regenerate" also refills its own unlocked picks.
 * Published gatherings stay as they are.
 */
export function GenerateButton({
  from,
  count,
  rows,
}: {
  from: string;
  count: number;
  rows: PlanRow[];
}) {
  const [open, setOpen] = useState(false);
  const { options, range, setRange } = useRange(from, count);
  const utils = api.useUtils();
  const generate = api.schedules.generate.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await utils.schedules.invalidate();
      setOpen(false);
      const left =
        result.open > 0
          ? ` ${plural(result.open, "slot")} left open: nobody was free.`
          : "";
      toast.success(
        `Filled ${plural(result.filled, "slot")} as drafts.${left}`
      );
    },
  });
  const shown = rows.filter((row) => inRange(row, range));
  const regenerable = shown.reduce(
    (sum, row) =>
      sum +
      (row.schedule.published
        ? 0
        : Object.values(row.schedule.generated).filter((slot) => !slot.locked)
            .length),
    0
  );
  const published = shown.filter(
    (row) => !row.suggested && row.schedule.published
  ).length;
  const run = (mode: "fill" | "regenerate") =>
    generate.mutate({ ...range, mode });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <Button onClick={() => setOpen(true)} size="sm" type="button">
        <Sparkles aria-hidden="true" className="size-4" />
        Generate
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate drafts</DialogTitle>
          <DialogDescription>
            Fills the open slots from the serving pool and rotates the groups.
            Preachers, locked picks and anything you picked yourself stay.
            Members see the drafts only once you publish them.
          </DialogDescription>
        </DialogHeader>
        <RangeFields
          id="generate"
          onChange={setRange}
          options={options}
          range={range}
        />
        {published > 0 ? (
          <p className="type-caption text-muted-foreground">
            {plural(published, "published gathering")} in this range{" "}
            {published === 1 ? "stays" : "stay"} as{" "}
            {published === 1 ? "it is" : "they are"}; edit{" "}
            {published === 1 ? "it" : "them"} in the grid.
          </p>
        ) : null}
        <DialogFooter>
          {regenerable > 0 ? (
            <Button
              disabled={generate.isPending}
              onClick={() => run("regenerate")}
              type="button"
              variant="secondary"
            >
              Regenerate {plural(regenerable, "unlocked pick")}
            </Button>
          ) : null}
          <Button
            disabled={generate.isPending}
            onClick={() => run("fill")}
            type="button"
          >
            {generate.isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Fill open slots
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Publish range (#112): every draft in the months picked, at once, after a confirmation. */
export function PublishButton({
  from,
  count,
  rows,
}: {
  from: string;
  count: number;
  rows: PlanRow[];
}) {
  const [open, setOpen] = useState(false);
  const { options, range, setRange } = useRange(from, count);
  const utils = api.useUtils();
  const publish = api.schedules.publishRange.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await utils.schedules.invalidate();
      setOpen(false);
      toast.success(
        `Published ${plural(result.published, "gathering")}. Members see ${
          result.published === 1 ? "it" : "them"
        } now.`
      );
    },
  });
  const drafts = rows.filter(
    (row) => !(row.suggested || row.schedule.published) && inRange(row, range)
  ).length;
  const span =
    range.from === range.through
      ? monthLabel(range.from)
      : `${monthLabel(range.from)} – ${monthLabel(range.through)}`;

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        <CalendarCheck aria-hidden="true" className="size-4" />
        Publish range
      </Button>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Publish drafts?</AlertDialogTitle>
          <AlertDialogDescription>
            Members will see them on the schedule, in My duties, among open
            slots and in their calendars. You can still change them in the grid
            afterwards.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RangeFields
          id="publish"
          onChange={setRange}
          options={options}
          range={range}
        />
        <p aria-live="polite" className="type-body-sm">
          {drafts > 0
            ? `${plural(drafts, "draft gathering")} in ${span}.`
            : `No drafts in ${span}.`}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={publish.isPending}>
            Not yet
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={drafts === 0 || publish.isPending}
            onClick={(event) => {
              // Stay open until it's saved, so an error can be read.
              event.preventDefault();
              publish.mutate(range);
            }}
          >
            {publish.isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Publish {plural(drafts, "gathering")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
