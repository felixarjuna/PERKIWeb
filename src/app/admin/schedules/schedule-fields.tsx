"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import type { FieldPath, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  FormControl,
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
import { Textarea } from "~/components/ui/textarea";
import {
  accommodation,
  liturgos,
  multimedia,
  musicians,
  noteWriter,
  speakers,
} from "~/lib/data";
import { cn } from "~/lib/utils";
import type { addScheduleSchema } from "~/server/api/schema/schema";
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

function SelectField({
  form,
  name,
  label,
  options,
  placeholder,
}: {
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
            onValueChange={field.onChange}
            value={typeof field.value === "string" ? field.value : ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder ?? "Choose someone"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                onSelect={field.onChange}
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
  const type = form.watch("type");
  const isService = type === "church_service";

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
              options={speakers}
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
          <SelectField
            form={form}
            label={isService ? "Liturgist" : "Leader"}
            name="leader"
            options={liturgos}
          />
          <SelectField
            form={form}
            label="Musician"
            name="musician"
            options={musicians}
          />
          <SelectField
            form={form}
            label="Note writer"
            name="noteWriter"
            options={noteWriter}
          />
          {isService ? (
            <>
              <SelectField
                form={form}
                label="Multimedia"
                name="multimedia"
                options={multimedia}
              />
              <SelectField
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
      </div>
    </div>
  );
}
