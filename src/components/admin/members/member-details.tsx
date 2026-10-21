"use client";

import type { RefObject } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { profileFieldLabels } from "~/lib/profile-completion";
import {
  type Member,
  memberCompletion,
  memberDate,
  memberName,
} from "./member-model";
import MemberRole from "./member-role";

const PHONE_FORMATTING = /[^\d+]/g;
function MemberValue({
  label,
  value,
}: {
  label?: string | null;
  value?: string | null;
}) {
  const text = value?.trim();
  if (!text) {
    return "Not provided";
  }
  if (label === "Email" && text.includes("@")) {
    return (
      <a className="underline underline-offset-4" href={`mailto:${text}`}>
        {text}
      </a>
    );
  }
  const phone = text.replace(PHONE_FORMATTING, "");
  if (label === "Phone" && phone) {
    return (
      <a className="underline underline-offset-4" href={`tel:${phone}`}>
        {text}
      </a>
    );
  }
  return text;
}

/** "Profile complete", "Profile not started" or "Missing: phone, address". */
function profileSummary(member: Member) {
  const { missing, state } = memberCompletion(member);
  if (state === "complete") {
    return "Profile complete";
  }
  if (state === "not-started") {
    return "Profile not started";
  }
  return `Missing: ${missing.map((field) => profileFieldLabels[field].toLowerCase()).join(", ")}`;
}

export default function MemberDetails({
  member,
  open,
  onOpenChange,
  returnFocus,
}: {
  member?: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const profile = member?.profiles ?? null;
  const fields = member
    ? [
        ["Email", member.user.email],
        ["Phone", profile?.phoneNumber],
        ["Location", profile?.location],
        ["Birthday", memberDate(profile?.birthday ?? null, true)],
        ["Registered", memberDate(profile?.createdAt ?? null)],
        ["Major", profile?.major],
        ["Address", profile?.address],
        ["About", profile?.bio],
      ]
    : [];
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-full flex-col gap-7 overflow-y-auto border-0 p-6 text-foreground sm:max-w-lg sm:p-8"
        onCloseAutoFocus={(event) => {
          const destination = returnFocus.current?.isConnected
            ? returnFocus.current
            : document.getElementById("member-search");
          if (destination) {
            event.preventDefault();
            destination.focus();
          }
        }}
      >
        <SheetHeader className="pt-5 text-left">
          <SheetTitle className="type-heading break-words">
            {member ? memberName(member) : "Member not found"}
          </SheetTitle>
          <SheetDescription>
            {member
              ? profileSummary(member)
              : "This profile is unavailable. Close this panel to return to the directory."}
          </SheetDescription>
        </SheetHeader>
        <dl className="flex flex-col gap-5">
          {fields.map(([label, value]) => (
            <div
              className="flex flex-col gap-1 border-border/40 border-b pb-4"
              key={label}
            >
              <dt className="type-caption text-muted-foreground">{label}</dt>
              <dd className="type-body-sm whitespace-pre-wrap break-words">
                <MemberValue label={label} value={value} />
              </dd>
            </div>
          ))}
        </dl>
        {member ? <MemberRole member={member} /> : null}
      </SheetContent>
    </Sheet>
  );
}
