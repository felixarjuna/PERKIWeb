"use client";

import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import type { ProfileField } from "~/lib/profile-completion";
import type { SaveProfileInput } from "~/server/api/schema/schema";

/** Length of the `YYYY-MM-DD` prefix of an ISO timestamp. */
const ISO_DATE_LENGTH = 10;

const placeholders: Record<ProfileField, string> = {
  address: "Roermonder Str. 110",
  birthday: "",
  location: "Aachen",
  major: "Maschinenbau",
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
  field: ProfileField,
  draft: string
): SaveProfileInput {
  if (field === "birthday") {
    return { birthday: draft ? new Date(`${draft}T00:00:00.000Z`) : null };
  }
  return { [field]: draft.trim() };
}

export default function ProfileFieldInput({
  field,
  id,
  onChange,
  value,
}: {
  field: ProfileField;
  id: string;
  onChange: (value: string) => void;
  value: string;
}) {
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
      autoComplete={field === "birthday" ? "bday" : undefined}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholders[field] || undefined}
      type={field === "birthday" ? "date" : "text"}
      value={value}
    />
  );
}
