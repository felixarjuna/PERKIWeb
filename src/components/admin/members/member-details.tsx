"use client";

import type { RefObject } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { type Member, memberDate, memberName } from "./member-model";

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
  const fields = member
    ? [
        ["Email", member.user?.email],
        ["Phone", member.profiles.phoneNumber],
        ["Location", member.profiles.location],
        ["Birthday", memberDate(member.profiles.birthday, true)],
        ["Registered", memberDate(member.profiles.createdAt)],
        ["Major", member.profiles.major],
        ["Address", member.profiles.address],
        ["About", member.profiles.bio],
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
              ? "Member profile · Community directory"
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
      </SheetContent>
    </Sheet>
  );
}
