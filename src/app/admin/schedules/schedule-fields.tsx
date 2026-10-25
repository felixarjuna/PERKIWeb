"use client";

import { format } from "date-fns";
import { CalendarIcon, CircleAlert } from "lucide-react";
import React from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Checkbox } from "~/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  accommodation,
  liturgos,
  multimedia,
  musicians,
  noteWriter,
} from "~/lib/data";
import {
  FLAG_LABELS,
  orderedFlags,
  SCHEDULE_FLAGS,
} from "~/lib/schedule-flags";
import { localDay, onPickedDay } from "~/lib/schedule-team";
import { type AwayPerson, awayLookup } from "~/lib/unavailability";
import { cn } from "~/lib/utils";
import type { addScheduleSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";
import { useGroupNames } from "./use-group-names";

export type ScheduleValues = z.infer<typeof addScheduleSchema>;
type Form = UseFormReturn<ScheduleValues>;

const EVENT_TYPES = [
  { label: "Church service", value: "church_service" },
  { label: "Bible study", value: "bible_study" },
] as const;

/** Slots only a church service has; cleared when switching to a Bible study. */
const SERVICE_ONLY = [
  "preacher",
  "multimedia",
  "accommodation",
  "cookingGroup",
] as const;

function teamDescription(type: ScheduleValues["type"] | undefined) {
  if (type === "church_service") {
    return "Who serves at this service, and which groups cook and clean.";
  }
  if (type === "bible_study") {
    return "Who serves at this Bible study, and which group cleans.";
  }
  return "Pick the type first: a service also has multimedia, accommodation and a cooking group.";
}

/** Keeps a saved value selectable even when it's no longer in the list (older schedules). */
const withCurrent = (options: readonly string[], value: unknown) =>
  typeof value === "string" && value !== "" && !options.includes(value)
    ? [value, ...options]
    : options;

/** Who of the people away that day a written name is, if any. */
type Away = (name: unknown) => AwayPerson | undefined;

function SelectField({
  away,
  form,
  name,
  label,
  options,
  placeholder,
}: {
  away?: Away;
  form: Form;
  name: FieldPath<ScheduleValues>;
  label: string;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            // No option is empty, so "" only comes from Radix's hidden native
            // select, which can't hold a stored name whose option isn't
            // registered yet (#126). Ignore it so the stored name stays.
            onValueChange={(value) => {
              if (value !== "") {
                field.onChange(value);
              }
            }}
            value={typeof field.value === "string" ? field.value : ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? "Choose someone"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {withCurrent(options, field.value).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                  {away?.(option) ? " · can't serve" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {away?.(field.value) ? (
            <p className="type-caption flex gap-1.5 text-pretty text-destructive-text">
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              Marked this day as one they can't serve. They stay on the schedule
              until you change it.
            </p>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField({ form }: { form: Form }) {
  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  className={cn(
                    "w-full justify-start bg-secondary pl-3 text-left font-normal hover:bg-secondary",
                    !field.value && "text-muted-foreground"
                  )}
                  type="button"
                  variant="secondary"
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon
                    aria-hidden="true"
                    className="ml-auto size-4 opacity-50"
                  />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-1">
              <Calendar
                autoFocus
                mode="single"
                onSelect={(picked) =>
                  field.onChange(
                    picked ? onPickedDay(picked, field.value) : picked
                  )
                }
                selected={field.value}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Event flags and cancelling, which the schedule shows as chips. */
function SpecialDateFields({ form }: { form: Form }) {
  return (
    <>
      <FormField
        control={form.control}
        name="flags"
        render={({ field }) => {
          const selected = field.value ?? [];
          return (
            <fieldset className="space-y-2">
              <legend className="font-medium text-sm leading-none">
                Flags
              </legend>
              <div className="flex flex-col gap-3 pt-1">
                {SCHEDULE_FLAGS.map((flag) => (
                  <FormItem className="flex items-center gap-3" key={flag}>
                    <FormControl>
                      <Checkbox
                        checked={selected.includes(flag)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            orderedFlags(
                              checked
                                ? [...selected, flag]
                                : selected.filter((value) => value !== flag)
                            )
                          )
                        }
                      />
                    </FormControl>
                    <FormLabel className="type-body-sm font-normal">
                      {FLAG_LABELS[flag]}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
            </fieldset>
          );
        }}
      />
      <FormField
        control={form.control}
        name="cancelled"
        render={({ field }) => (
          <FormItem className="flex items-start justify-between gap-4 rounded-lg bg-secondary p-4">
            <div className="space-y-1">
              <FormLabel>Cancelled</FormLabel>
              <FormDescription className="type-body-sm">
                Stays on the schedule, crossed out. Nobody serves, so it leaves
                everyone's duties and the open slots. Takeaways are kept.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}

/** Everyone who can't serve on the chosen day, with their notes (staff only). */
function AwayNotice({ people }: { people: AwayPerson[] }) {
  if (people.length === 0) {
    return null;
  }
  return (
    <div className="@md:col-span-2 rounded-lg bg-secondary p-4">
      <p className="type-body-sm flex items-center gap-2">
        <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        Can't serve this day
      </p>
      <ul className="mt-2 space-y-1">
        {people.map((person) => (
          <li
            className="type-body-sm text-pretty text-muted-foreground"
            key={person.name}
          >
            <span className="text-foreground">{person.name}</span>
            {person.note ? ` · ${person.note}` : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="@container rounded-xl bg-card p-4 sm:p-6">
      <h2 className="type-subheading">{title}</h2>
      <p className="type-body-sm mt-1 text-muted-foreground">{description}</p>
      <div className="mt-5 grid @md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

/**
 * The schedule form body shared by "add" and "edit": the gathering on the
 * left and its team on the right on wide screens, stacked on phones. Only the
 * slots the chosen event type has are shown.
 */
export function ScheduleFields({ form }: { form: Form }) {
  const groupNames = useGroupNames();
  const { data: activeSpeakers } = api.speakers.active.useQuery();
  const speakerNames = activeSpeakers?.map((speaker) => speaker.name) ?? [];
  const type = form.watch("type");
  const isService = type === "church_service";
  const date = form.watch("date");
  const day = date ? localDay(date) : "";
  const { data: awayToday = [] } = api.unavailability.onDay.useQuery(
    { day },
    { enabled: day !== "" }
  );
  const away = awayLookup(awayToday);

  React.useEffect(() => {
    if (type === "bible_study") {
      for (const name of SERVICE_ONLY) {
        form.setValue(name, undefined);
      }
    }
  }, [form, type]);

  return (
    <div className="@container">
      <div className="grid @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-6">
        <Panel
          description="What happens, when, and which passage it's about."
          title="Gathering"
        >
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fellowship Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Service or Bible study" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DateField form={form} />
          <div className="@md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bibleVerse"
            render={({ field }) => (
              <FormItem className={isService ? undefined : "@md:col-span-2"}>
                <FormLabel>Bible Verse</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isService ? (
            <SelectField
              form={form}
              label="Preacher"
              name="preacher"
              options={speakerNames}
              placeholder="Choose the speaker"
            />
          ) : null}
          <div className="@md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-40"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Panel>

        <Panel description={teamDescription(type)} title="Team">
          <AwayNotice people={awayToday} />
          <SelectField
            away={away}
            form={form}
            label={isService ? "Liturgist" : "Leader"}
            name="leader"
            options={liturgos}
          />
          <SelectField
            away={away}
            form={form}
            label="Musician"
            name="musician"
            options={musicians}
          />
          <SelectField
            away={away}
            form={form}
            label="Note writer"
            name="noteWriter"
            options={noteWriter}
          />
          {isService ? (
            <>
              <SelectField
                away={away}
                form={form}
                label="Multimedia"
                name="multimedia"
                options={multimedia}
              />
              <SelectField
                away={away}
                form={form}
                label="Accommodation"
                name="accommodation"
                options={accommodation}
              />
              <SelectField
                form={form}
                label="Cooking Group"
                name="cookingGroup"
                options={groupNames}
                placeholder="Choose a group"
              />
            </>
          ) : null}
          <SelectField
            form={form}
            label="Cleaning Group"
            name="cleaningGroup"
            options={groupNames}
            placeholder="Choose a group"
          />
        </Panel>

        <Panel
          description="Flags show as chips on the schedule, for everyone."
          title="Special date"
        >
          <SpecialDateFields form={form} />
        </Panel>
      </div>
    </div>
  );
}
