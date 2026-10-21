/** The member details we ask for, in the order every form shows them. */
export const PROFILE_FIELDS = [
  "birthday",
  "phoneNumber",
  "location",
  "address",
  "major",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const profileFieldLabels: Record<ProfileField, string> = {
  address: "Address",
  birthday: "Birthday",
  location: "Where you live",
  major: "Studies",
  phoneNumber: "Phone",
};

/** Why we ask, shown under each field. */
export const profileFieldReasons: Record<ProfileField, string> = {
  address: "So we can reach you when it matters",
  birthday: "So we can celebrate with you",
  location: "So we know where our members live",
  major: "So we know what you study",
  phoneNumber: "So we can add you to the PERKI WhatsApp group",
};

export type ProfileValues = Partial<Record<ProfileField, string | Date | null>>;
export type ProfileState = "not-started" | "incomplete" | "complete";

export interface ProfileCompletion {
  filled: number;
  missing: ProfileField[];
  state: ProfileState;
  total: typeof PROFILE_FIELDS.length;
}

const isFilled = (value: string | Date | null | undefined) => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime());
  }
  return Boolean(value?.trim());
};

/** How much of a profile is filled in; `null` means no profile yet. */
export function profileCompletion(
  profile: ProfileValues | null
): ProfileCompletion {
  const missing = PROFILE_FIELDS.filter((field) => !isFilled(profile?.[field]));
  const filled = PROFILE_FIELDS.length - missing.length;
  let state: ProfileState = "incomplete";
  if (!profile) {
    state = "not-started";
  } else if (missing.length === 0) {
    state = "complete";
  }
  return { filled, missing, state, total: PROFILE_FIELDS.length };
}
