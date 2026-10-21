"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import type { ProfileField } from "~/lib/profile-completion";
import { cn } from "~/lib/utils";
import type { SaveProfileInput } from "~/server/api/schema/schema";

/** Length of the `YYYY-MM-DD` prefix of an ISO timestamp. */
const ISO_DATE_LENGTH = 10;

/** A member detail, or the optional nickname next to the Google name. */
export type EditableField = ProfileField | "nickname";

const placeholders: Record<EditableField, string> = {
  address: "Roermonder Str. 110",
  birthday: "",
  location: "Aachen",
  major: "Maschinenbau",
  nickname: "What friends call you",
  phoneNumber: "+49 151 12345678",
};

/** A field as the form edits it: always text, a birthday as `YYYY-MM-DD`. */
export function draftOf(value: string | Date | null | undefined): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? value.toISOString().slice(0, ISO_DATE_LENGTH)
      : "";
  }
  return value ?? "";
}

/**
 * The save input for one edited field. Birthdays are stored as UTC
 * midnight, like the old join form; an empty value clears the field.
 */
export function saveInputOf(
  field: EditableField,
  draft: string
): SaveProfileInput {
  if (field === "birthday") {
    return { birthday: draft ? new Date(`${draft}T00:00:00.000Z`) : null };
  }
  return { [field]: draft.trim() };
}

const DRAFT_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const OLDEST_BIRTH_YEAR = 1940;
/** Where an empty birthday opens: nearer most members than today. */
const FIRST_SHOWN_YEAR = 2000;

/** A `YYYY-MM-DD` draft as a local calendar day, the way the picker shows it. */
function localDay(draft: string): Date | undefined {
  const match = DRAFT_DATE.exec(draft);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : undefined;
}

/** The schedule form's date picker, with month and year dropdowns. */
function BirthdayPicker({
  id,
  onChange,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selected = localDay(value);
  const today = new Date();
  const shown = selected ? format(selected, "PPP") : "Pick a date";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          // The field's <Label> would otherwise replace the shown date.
          aria-label={`Birthday, ${shown}`}
          className={cn(
            "w-full justify-start bg-secondary pl-3 text-left font-normal hover:bg-secondary",
            !selected && "text-muted-foreground"
          )}
          id={id}
          type="button"
          variant="secondary"
        >
          <span>{shown}</span>
          <CalendarIcon
            aria-hidden="true"
            className="ml-auto size-4 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1">
        <Calendar
          autoFocus
          captionLayout="dropdown"
          defaultMonth={selected ?? new Date(FIRST_SHOWN_YEAR, 0)}
          endMonth={today}
          mode="single"
          onSelect={(picked) =>
            onChange(picked ? format(picked, "yyyy-MM-dd") : "")
          }
          selected={selected}
          startMonth={new Date(OLDEST_BIRTH_YEAR, 0)}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function ProfileFieldInput({
  field,
  id,
  onChange,
  value,
}: {
  field: EditableField;
  id: string;
  onChange: (value: string) => void;
  value: string;
}) {
  if (field === "birthday") {
    return <BirthdayPicker id={id} onChange={onChange} value={value} />;
  }
  if (field === "phoneNumber") {
    return (
      <PhoneInput
        autoComplete="tel"
        defaultCountry="DE"
        id={id}
        onChange={(next) => onChange(next)}
        placeholder={placeholders.phoneNumber}
        value={value}
      />
    );
  }
  return (
    <Input
      id={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholders[field] || undefined}
      type="text"
      value={value}
    />
  );
}
