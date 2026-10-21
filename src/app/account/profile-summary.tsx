"use client";

import { ChevronRight, CircleCheck } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import ProfileFieldInput, {
  draftOf,
  saveInputOf,
} from "~/components/profile-field-input";
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
  PROFILE_FIELDS,
  type ProfileField,
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

/** Edits one field: the input, why we ask, Save and Cancel. */
function FieldEditor({
  field,
  initial,
  onClose,
}: {
  field: ProfileField;
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
            toast.success(`${profileFieldLabels[field]} saved`);
            onClose();
          },
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{profileFieldLabels[field]}</Label>
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
  const [editing, setEditing] = useState<ProfileField | null>(null);
  if (!data) {
    return <div className="h-80 animate-pulse rounded-xl bg-card" />;
  }
  const { completion, profile } = data;
  const percent = (completion.filled / completion.total) * 100;
  return (
    <div className="flex flex-col gap-4">
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
                className="size-4 shrink-0 translate-y-px"
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
            : "A few details help us care for you as a fellowship."}
        </p>
      </section>
      <ul className="flex flex-col rounded-xl bg-card p-2 sm:p-3">
        {PROFILE_FIELDS.map((field) => {
          const value = shown(profile?.[field]);
          return (
            <li key={field}>
              <button
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setEditing(field)}
                type="button"
              >
                <span className="type-body-sm flex-1">
                  {profileFieldLabels[field]}
                </span>{" "}
                {value ? (
                  <span className="type-body-sm min-w-0 truncate text-muted-foreground">
                    {value}
                  </span>
                ) : (
                  <span className="type-caption rounded-full bg-paper px-2 py-1 text-paper-foreground">
                    Add
                  </span>
                )}
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
            </li>
          );
        })}
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
                <DialogTitle>{profileFieldLabels[editing]}</DialogTitle>
                <DialogDescription>
                  {profileFieldReasons[editing]}
                </DialogDescription>
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
