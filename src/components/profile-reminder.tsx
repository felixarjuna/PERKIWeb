"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  type ProfileField,
  profileFieldLabels,
  profileFieldReasons,
} from "~/lib/profile-completion";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

/** Until when (ms) "Remind me later" hides the reminder on this device. */
export const SNOOZE_KEY = "perki:profile-reminder-snoozed-until";
const SNOOZE_DAYS = 7;
const DAY_MS = 86_400_000;
/** The reminder this one replaced hid itself forever. */
const LEGACY_KEY = "perki:member-prompt-dismissed";
const HIDDEN_ON = new Set(["/account", "/welcome"]);

const snoozedUntil = () => {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
    return Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
  } catch {
    return 0;
  }
};

const listed = (fields: ProfileField[]) => {
  const names = fields.map((field) => profileFieldLabels[field].toLowerCase());
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : (names[0] ?? "");
};

/**
 * Asks signed-in people to finish their profile on app pages. "Remind me
 * later" hides it for a week on this device; then it comes back.
 */
export default function ProfileReminder() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Hidden until storage is read, so a snoozed reminder never flashes.
  const [snoozed, setSnoozed] = useState(true);
  const { data } = api.profiles.mine.useQuery(undefined, {
    enabled: Boolean(session),
  });

  useEffect(() => {
    setSnoozed(snoozedUntil() > Date.now());
  }, []);

  if (
    snoozed ||
    !(session && data) ||
    data.completion.state === "complete" ||
    HIDDEN_ON.has(pathname)
  ) {
    return null;
  }

  const { filled, missing, total } = data.completion;
  const snooze = () => {
    setSnoozed(true);
    try {
      window.localStorage.setItem(
        SNOOZE_KEY,
        String(Date.now() + SNOOZE_DAYS * DAY_MS)
      );
    } catch {
      // Storage unavailable: hide it for this visit only.
    }
  };

  return (
    <aside
      aria-label="Complete your profile"
      className="mt-8 flex flex-col gap-3 rounded-xl bg-popover p-4 text-popover-foreground shadow-sm sm:mt-10"
    >
      <p className="type-body">
        Your profile is {filled} of {total} done
      </p>
      <div
        aria-hidden="true"
        className="h-1.5 overflow-hidden rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(filled / total) * 100}%` }}
        />
      </div>
      <p className="type-body-sm text-muted-foreground">
        Still to add: {listed(missing)}.{" "}
        {missing[0] ? `${profileFieldReasons[missing[0]]}.` : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link className={cn(buttonVariants({ size: "sm" }))} href="/account">
          Finish my profile
        </Link>
        <Button onClick={snooze} size="sm" type="button" variant="ghost">
          Remind me later
        </Button>
      </div>
    </aside>
  );
}
