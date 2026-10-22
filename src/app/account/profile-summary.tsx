"use client";

import { ChevronRight, CircleCheck, Lock, Plus } from "lucide-react";
import { DateTime } from "luxon";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { PersonAvatar } from "~/components/person-avatar";
import ProfileFieldInput, {
  draftOf,
  type EditableField,
  saveInputOf,
} from "~/components/profile-field-input";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  PROFILE_FIELDS,
  profileFieldLabels,
  profileFieldReasons,
} from "~/lib/profile-completion";
import { api } from "~/trpc/react";

const shown = (value: string | Date | null | undefined) => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? DateTime.fromJSDate(value, { zone: "utc" }).toFormat("d LLLL")
      : null;
  }
  return value?.trim() || null;
};

const labels: Record<EditableField, string> = {
  ...profileFieldLabels,
  bio: "About me",
  nickname: "Nickname",
};
const reasons: Record<EditableField, string> = {
  ...profileFieldReasons,
  bio: "A few lines so others in the fellowship get to know you. Staff and signed-in members can read it.",
  nickname:
    "What you'd like to be called. Your name from Google stays as it is.",
};

const rowClass =
  "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left";

const FROM_GOOGLE = "From your Google account. It can't be changed here.";

/**
 * The lock before a Google field. Its tooltip also opens on tap, since
 * touch screens never hover and most members are on their phones.
 */
function LockHint({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip onOpenChange={setOpen} open={open}>
        <TooltipTrigger asChild>
          <button
            aria-label={`${label} comes from Google`}
            // A 24px target whose padding overlaps the gap, so the lock
            // sits close to the label.
            className="-ml-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => {
              // Radix closes a tooltip on click; a tap should show it.
              event.preventDefault();
              setOpen(true);
            }}
            type="button"
          >
            <Lock aria-hidden="true" className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-56" side="top">
          {FROM_GOOGLE}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Name or email from Google: shown with a lock, never edited here. */
function LockedRow({
  children,
  label,
  value,
}: {
  children?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <li className={rowClass}>
      <span className="flex flex-1 items-center gap-1">
        <span className="type-body-sm">{label}</span>
        <LockHint label={label} />
      </span>
      {children ?? (
        // Wraps rather than truncates: a locked row can't be opened to read
        // the rest of a long email.
        <span className="type-body-sm min-w-0 break-all text-right text-muted-foreground">
          {value || "Not set"}
        </span>
      )}
    </li>
  );
}

/** A detail the member edits: tapping the row opens its editor. */
function EditableRow({
  optional = false,
  label,
  onEdit,
  value,
}: {
  optional?: boolean;
  label: string;
  onEdit: () => void;
  value: string | null;
}) {
  // Quiet "Optional" text; only what's still missing gets the cream chip.
  const placeholder = optional ? (
    <span className="type-body-sm text-muted-foreground">Optional</span>
  ) : (
    <Badge icon={Plus} size="status" variant="published">
      Add
    </Badge>
  );
  return (
    <li>
      <button
        className={`${rowClass} hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        onClick={onEdit}
        type="button"
      >
        <span className="type-body-sm flex-1 whitespace-nowrap">{label}</span>{" "}
        {value ? (
          <span className="type-body-sm min-w-0 truncate text-muted-foreground">
            {value}
          </span>
        ) : (
          placeholder
        )}
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </button>
    </li>
  );
}

/** Edits one field: the input, why we ask, Save and Cancel. */
function FieldEditor({
  field,
  initial,
  onClose,
}: {
  field: EditableField;
  initial: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const utils = api.useUtils();
  const save = api.profiles.saveMine.useMutation();
  const id = `profile-${field}`;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(saveInputOf(field, draft), {
          onError: (error) =>
            toast.error("Couldn't save", { description: error.message }),
          onSuccess: async () => {
            await utils.profiles.invalidate();
            toast.success(`${labels[field]} saved`);
            onClose();
          },
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{labels[field]}</Label>
        <ProfileFieldInput
          field={field}
          id={id}
          onChange={setDraft}
          value={draft}
        />
      </div>
      <DialogFooter className="gap-2">
        <Button onClick={onClose} type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={save.isPending} type="submit">
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Progress plus one row per detail; tapping a row edits just that field. */
export default function ProfileSummary() {
  const { data } = api.profiles.mine.useQuery();
  const { data: account } = api.users.getUserById.useQuery();
  const [editing, setEditing] = useState<EditableField | null>(null);
  if (!data) {
    return <div className="h-80 animate-pulse rounded-xl bg-card" />;
  }
  const { completion, profile } = data;
  const percent = (completion.filled / completion.total) * 100;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col rounded-xl bg-card p-2 sm:p-3">
        <LockedRow label="Photo">
          <PersonAvatar
            person={{
              image: account?.image ?? null,
              name: account?.name ?? "",
            }}
            size="md"
          />
        </LockedRow>
        <LockedRow label="Name" value={account?.name} />
        <LockedRow label="Email" value={account?.email} />
      </ul>
      <section className="flex flex-col gap-2 rounded-xl bg-card p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="type-subheading" id="profile-progress">
            Profile
          </h2>
          {completion.state === "complete" ? (
            <span className="type-body-sm inline-flex items-center gap-1.5 text-foreground">
              {/* Satoshi's letters sit low in their line box; 1px down centres
                  the icon on the capitals instead of the box. */}
              <CircleCheck
                aria-hidden="true"
                // Filled: the circle takes the text colour, the check the card's.
                className="size-4 shrink-0 translate-y-px fill-current stroke-card"
              />
              Completed
            </span>
          ) : (
            <span className="type-body-sm text-muted-foreground tabular-nums">
              {completion.filled} of {completion.total}
            </span>
          )}
        </div>
        <div
          aria-labelledby="profile-progress"
          aria-valuemax={completion.total}
          aria-valuemin={0}
          aria-valuenow={completion.filled}
          className="h-1.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="type-body-sm text-muted-foreground">
          {completion.state === "complete"
            ? "All done. Thank you for helping us care for you."
            : `${completion.total - completion.filled} more to go.`}
        </p>
      </section>
      <ul className="flex flex-col rounded-xl bg-card p-2 sm:p-3">
        {PROFILE_FIELDS.map((field) => (
          <EditableRow
            key={field}
            label={labels[field]}
            onEdit={() => setEditing(field)}
            value={shown(profile?.[field])}
          />
        ))}
        <EditableRow
          label={labels.nickname}
          onEdit={() => setEditing("nickname")}
          optional
          value={shown(profile?.nickname)}
        />
        <EditableRow
          label={labels.bio}
          onEdit={() => setEditing("bio")}
          optional
          value={shown(profile?.bio)}
        />
      </ul>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        open={editing !== null}
      >
        <DialogContent className="bg-card">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle>{labels[editing]}</DialogTitle>
                <DialogDescription>{reasons[editing]}</DialogDescription>
              </DialogHeader>
              <FieldEditor
                field={editing}
                initial={draftOf(profile?.[editing])}
                key={editing}
                onClose={() => setEditing(null)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
