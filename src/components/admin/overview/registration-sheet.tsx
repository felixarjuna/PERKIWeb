"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { memberDate, memberName } from "../members/member-model";
import type { RegistrationBucket } from "./overview-model";

/** Who registered in one chart bucket (a month, quarter or year). */
export default function RegistrationSheet({
  bucket,
  locationLabel,
  onClose,
}: {
  bucket?: RegistrationBucket;
  /** Set when the overview is filtered to one location. */
  locationLabel?: string;
  onClose: () => void;
}) {
  const count = bucket?.members.length ?? 0;
  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={Boolean(bucket)}
    >
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto border-0 p-6 text-foreground sm:max-w-md">
        <SheetHeader className="pt-5 text-left">
          <SheetTitle className="type-heading">
            Registered in {bucket?.fullLabel}
          </SheetTitle>
          <SheetDescription>
            {count} new member {count === 1 ? "profile" : "profiles"}
            {locationLabel ? ` in ${locationLabel}` : ""}
          </SheetDescription>
        </SheetHeader>
        {count ? (
          <ul className="flex flex-col divide-y divide-border/40">
            {bucket?.members.map((member) => (
              <li
                className="flex items-center gap-3 py-2"
                key={member.profiles.id}
              >
                <span className="type-caption flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  {memberName(member).slice(0, 2).toUpperCase()}
                </span>
                <Link
                  className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                  href={`/admin/members?member=${encodeURIComponent(member.profiles.id)}`}
                >
                  <span className="type-body-sm block truncate hover:underline">
                    {memberName(member)}
                  </span>
                  <span className="type-caption block truncate text-muted-foreground">
                    {member.profiles.location?.trim() ||
                      "Location not provided"}
                  </span>
                </Link>
                <span className="type-caption shrink-0 text-muted-foreground tabular-nums">
                  {memberDate(member.profiles.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-body-sm text-muted-foreground">
            No one registered in this period.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
