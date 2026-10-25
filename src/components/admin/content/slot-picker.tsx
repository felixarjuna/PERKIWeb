"use client";

import {
  ChevronsUpDown,
  CircleAlert,
  LoaderCircle,
  Lock,
  LockOpen,
  Sparkles,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { type ComponentProps, type KeyboardEvent, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { nameKey } from "~/lib/people";
import {
  columnLabel,
  columnRole,
  type GeneratedSlot,
  type Plan,
  type PlanColumn,
  type PlanOption,
  type PlanSchedule,
} from "~/lib/plan-grid";
import { type PlanWarning, planWarnings } from "~/lib/schedule-team";
import { cn } from "~/lib/utils";

/** The warnings under a slot, in the readable validation color. */
export function WarningList({
  warnings,
  className,
}: {
  warnings: PlanWarning[];
  className?: string;
}) {
  if (warnings.length === 0) {
    return null;
  }
  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {warnings.map((warning) => (
        <li
          className="type-caption flex gap-1 text-pretty text-destructive-text"
          key={warning.code}
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
          {warning.message}
        </li>
      ))}
    </ul>
  );
}

/**
 * Why the generator put this person or group here (#112), with a button to
 * keep the pick when "Regenerate" runs again.
 */
function GeneratedNote({
  slot,
  label,
  onLock,
  pending,
}: {
  slot: GeneratedSlot;
  label: string;
  onLock?: () => void;
  pending: boolean;
}) {
  const Icon = slot.locked ? Lock : Sparkles;
  return (
    <div className="flex items-start gap-1">
      <p className="type-caption flex min-w-0 flex-1 gap-1 text-pretty text-muted-foreground">
        <Icon aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
        <span>
          {slot.locked ? "Locked. " : "Generated: "}
          {slot.reason}
        </span>
      </p>
      {onLock && !slot.locked ? (
        <Button
          aria-label={`Lock ${label}`}
          className="-my-1 size-8 shrink-0"
          disabled={pending}
          onClick={onLock}
          size="icon"
          title="Lock: Regenerate keeps this pick"
          type="button"
          variant="ghost"
        >
          <LockOpen aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

const lastServed = (day: string | null) =>
  day ? `last ${DateTime.fromISO(day).toFormat("d LLL")}` : "not served yet";

function PersonItem({
  option,
  onSelect,
}: {
  option: PlanOption;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      className="flex-col items-stretch gap-0.5"
      onSelect={onSelect}
      value={`${option.name} ${option.userId}`}
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate">{option.name}</span>
        {option.note ? (
          <span className="type-caption text-muted-foreground">
            {option.note}
          </span>
        ) : null}
        <span
          className="type-caption shrink-0 text-muted-foreground tabular-nums"
          title={`Served ${option.servedThisTerm} times this term`}
        >
          {option.servedThisTerm}×
        </span>
      </span>
      <span className="type-caption text-muted-foreground">
        {lastServed(option.lastDay)}
      </span>
      <WarningList warnings={option.warnings} />
    </CommandItem>
  );
}

const warningCount = (count: number) =>
  count === 1 ? "1 warning" : `${count} warnings`;

/** The button in a cell: who's in the slot, a mark when there are warnings. */
function SlotTrigger({
  label,
  holder,
  warnings,
  pending,
  ...props
}: ComponentProps<typeof Button> & {
  label: string;
  holder: string | null;
  warnings: number;
  pending: boolean;
}) {
  return (
    <Button
      {...props}
      aria-label={`${label}: ${holder ?? "open"}${warnings > 0 ? `, ${warningCount(warnings)}` : ""}`}
      className={cn(
        "h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 text-left font-normal",
        holder ? "" : "text-muted-foreground"
      )}
      disabled={pending}
      type="button"
      variant="secondary"
    >
      <span className="min-w-0 truncate">{holder ?? "Open"}</span>
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin"
        />
      ) : (
        <span className="flex shrink-0 items-center gap-1">
          {warnings > 0 ? (
            <CircleAlert
              aria-hidden="true"
              className="size-4 text-destructive-text"
            />
          ) : null}
          <ChevronsUpDown aria-hidden="true" className="size-4 opacity-60" />
        </span>
      )}
    </Button>
  );
}

const ARROWS: Record<string, [row: number, column: number]> = {
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
  ArrowUp: [-1, 0],
};

/**
 * Moves focus to the nearest cell in an arrow's direction, skipping slots a
 * gathering doesn't have, as in a spreadsheet. Returns whether it moved.
 */
function moveFocus(from: HTMLElement, key: string) {
  const step = ARROWS[key];
  const grid = from.closest("[data-plan-grid]");
  if (!(step && grid)) {
    return false;
  }
  const at = (element: Element) => ({
    column: Number(element.getAttribute("data-plan-column")),
    row: Number(element.getAttribute("data-plan-row")),
  });
  const here = at(from);
  const [rowStep, columnStep] = step;
  const [target] = [...grid.querySelectorAll<HTMLElement>("[data-plan-row]")]
    .filter((cell) => {
      const there = at(cell);
      return rowStep === 0
        ? there.row === here.row &&
            Math.sign(there.column - here.column) === columnStep
        : there.column === here.column &&
            Math.sign(there.row - here.row) === rowStep;
    })
    .sort((a, b) => {
      const distance = (cell: Element) =>
        Math.abs(at(cell).row - here.row) +
        Math.abs(at(cell).column - here.column);
      return distance(a) - distance(b);
    });
  target?.focus();
  return Boolean(target);
}

/** A key that types a letter or digit (not a shortcut). */
const types = (event: KeyboardEvent<HTMLElement>) =>
  event.key.length === 1 &&
  event.key !== " " &&
  !(event.ctrlKey || event.metaKey || event.altKey);

/** Speakers for the preacher, the day's groups for cooking and cleaning. */
function plainOptions(plan: Plan, schedule: PlanSchedule, column: PlanColumn) {
  const role = columnRole(column, schedule.type);
  if (role === "preacher") {
    return plan.speakers;
  }
  return role === null ? plan.groupNames(schedule) : [];
}

/**
 * One slot of one gathering: a button showing who's in it, opening a
 * searchable list of the pool (least recently served first, with this
 * term's count and the warnings each person would get), the speakers or the
 * groups. A typed name can be used as it is; warnings never stop a choice.
 */
export function SlotPicker({
  plan,
  schedule,
  column,
  onLock,
  onPick,
  pending,
  position,
  showLabel,
}: {
  plan: Plan;
  schedule: PlanSchedule;
  column: PlanColumn;
  /** Keeps a generated pick; only drafts can be regenerated. */
  onLock?: () => void;
  onPick: (name: string | null, userId?: string) => void;
  pending: boolean;
  /** The cell's place in the desk grid, for arrow keys; none on phones. */
  position?: { column: number; row: number };
  /** Phones show the slot's name above the button; the grid has headers. */
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const cell = plan.cell(schedule, column);
  const generated = schedule.generated[column];
  const role = columnRole(column, schedule.type);
  const label = columnLabel(column, schedule.type);
  const day = DateTime.fromJSDate(schedule.date)
    .setZone("Europe/Berlin")
    .toFormat("d LLL");
  const pick = (name: string | null, userId?: string) => {
    setOpen(false);
    setSearch("");
    if (name !== cell.value || userId !== (cell.userId ?? undefined)) {
      onPick(name, userId);
    }
  };
  const { inScope, elsewhere } = plan.options(schedule, column);
  const plain = plainOptions(plan, schedule, column);
  const typed = search.trim();
  const known = [
    ...inScope.map((option) => option.name),
    ...elsewhere.map((option) => option.name),
    ...plain,
  ].some((name) => nameKey(name) === nameKey(typed));
  const groupWarnings = (group: string) =>
    planWarnings({
      cleaningGroup:
        column === "cleaningGroup" ? group : schedule.cleaningGroup,
      cookingGroup: column === "cookingGroup" ? group : schedule.cookingGroup,
      kind: "groups",
    });

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {showLabel ? (
        <span className="type-caption text-muted-foreground">{label}</span>
      ) : null}
      <Popover
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setSearch("");
          }
        }}
        open={open}
      >
        <PopoverTrigger asChild>
          <SlotTrigger
            data-plan-column={position?.column}
            data-plan-row={position?.row}
            holder={cell.value}
            label={`${label} on ${day}`}
            onKeyDown={(event) => {
              if (position && moveFocus(event.currentTarget, event.key)) {
                event.preventDefault();
              } else if (types(event)) {
                // Typing in a cell opens its list, already searching.
                event.preventDefault();
                setSearch(event.key);
                setOpen(true);
              }
            }}
            pending={pending}
            warnings={cell.warnings.length}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <Command>
            <CommandInput
              onValueChange={setSearch}
              placeholder={
                role === null ? "Search groups…" : "Search or type a name…"
              }
              value={search}
            />
            <CommandList>
              <CommandEmpty>Nobody found.</CommandEmpty>
              {inScope.length > 0 ? (
                <CommandGroup heading="Serving pool">
                  {inScope.map((option) => (
                    <PersonItem
                      key={option.userId}
                      onSelect={() => pick(option.name, option.userId)}
                      option={option}
                    />
                  ))}
                </CommandGroup>
              ) : null}
              {elsewhere.length > 0 ? (
                <CommandGroup heading="Serves at other gatherings">
                  {elsewhere.map((option) => (
                    <PersonItem
                      key={option.userId}
                      onSelect={() => pick(option.name, option.userId)}
                      option={option}
                    />
                  ))}
                </CommandGroup>
              ) : null}
              {plain.length > 0 ? (
                <CommandGroup heading={role === null ? "Groups" : "Speakers"}>
                  {plain.map((name) => (
                    <CommandItem
                      className="flex-col items-stretch gap-0.5"
                      key={name}
                      onSelect={() => pick(name)}
                      value={name}
                    >
                      {name}
                      {role === null ? (
                        <WarningList warnings={groupWarnings(name)} />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {typed && !known ? (
                <CommandGroup heading="Not in the list">
                  <CommandItem onSelect={() => pick(typed)} value={typed}>
                    Use “{typed}”
                  </CommandItem>
                </CommandGroup>
              ) : null}
              {cell.value ? (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => pick(null)}
                    value="Empty this slot"
                  >
                    <X aria-hidden="true" className="size-4" />
                    Empty this slot
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <WarningList warnings={cell.warnings} />
      {generated && cell.value ? (
        <GeneratedNote
          label={`${label} on ${day}`}
          onLock={onLock}
          pending={pending}
          slot={generated}
        />
      ) : null}
    </div>
  );
}
