"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { api, type RouterOutputs } from "~/trpc/react";

type Speaker = RouterOutputs["speakers"]["all"][number];

interface Draft {
  active: boolean;
  aliases: string;
  favoriteVerse: string;
  name: string;
  photoUrl: string;
  story: string;
}

const draftOf = (speaker?: Speaker, name = ""): Draft => ({
  active: speaker?.active ?? true,
  aliases: speaker?.aliases.join(", ") ?? "",
  favoriteVerse: speaker?.favoriteVerse ?? "",
  name: speaker?.name ?? name,
  photoUrl: speaker?.photoUrl ?? "",
  story: speaker?.story ?? "",
});

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p className="type-caption text-muted-foreground" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Adds or edits a guest speaker. Opened with `speaker` to edit, or with a
 * `name` to start a new speaker from an unmatched preacher name.
 */
export function SpeakerDialog({
  open,
  onOpenChange,
  speaker,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  speaker?: Speaker;
  name?: string;
}) {
  const [draft, setDraft] = React.useState(() => draftOf(speaker, name));
  React.useEffect(() => {
    if (open) {
      setDraft(draftOf(speaker, name));
    }
  }, [open, speaker, name]);
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]) =>
      setDraft((current) => ({ ...current, [key]: value }));

  const utils = api.useUtils();
  const onSuccess = async () => {
    await Promise.all([
      utils.speakers.invalidate(),
      utils.schedules.invalidate(),
    ]);
    toast.success(speaker ? "Speaker saved" : "Speaker added");
    onOpenChange(false);
  };
  const onError = (error: { message: string }) => toast.error(error.message);
  const create = api.speakers.create.useMutation({ onError, onSuccess });
  const update = api.speakers.update.useMutation({ onError, onSuccess });
  const pending = create.isPending || update.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = {
      ...draft,
      aliases: draft.aliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
    };
    if (speaker) {
      update.mutate({ ...input, id: speaker.id });
    } else {
      create.mutate(input);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {speaker ? "Edit speaker" : "Add a speaker"}
          </DialogTitle>
          <DialogDescription>
            Active speakers appear in the preacher list and under “Our pastors”
            on the home page.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" id="speaker-form" onSubmit={submit}>
          <Field
            hint="With the title, as it should appear: Pdt. John Kusuma."
            id="speaker-name"
            label="Name"
          >
            <Input
              aria-describedby="speaker-name-hint"
              id="speaker-name"
              onChange={(event) => set("name")(event.target.value)}
              required
              value={draft.name}
            />
          </Field>
          <Field
            hint="A full link to the photo, or a site path like /images/john.jpg."
            id="speaker-photo"
            label="Photo"
          >
            <Input
              aria-describedby="speaker-photo-hint"
              id="speaker-photo"
              inputMode="url"
              onChange={(event) => set("photoUrl")(event.target.value)}
              value={draft.photoUrl}
            />
          </Field>
          <Field id="speaker-verse" label="Favourite verse">
            <Input
              id="speaker-verse"
              onChange={(event) => set("favoriteVerse")(event.target.value)}
              value={draft.favoriteVerse}
            />
          </Field>
          <Field id="speaker-story" label="Story">
            <Textarea
              className="min-h-32"
              id="speaker-story"
              onChange={(event) => set("story")(event.target.value)}
              value={draft.story}
            />
          </Field>
          <Field
            hint="Other ways the schedule writes this name, separated by commas: Ev. Riggrubben, Ev. Nehemiah Riggruben."
            id="speaker-aliases"
            label="Also written as"
          >
            <Input
              aria-describedby="speaker-aliases-hint"
              id="speaker-aliases"
              onChange={(event) => set("aliases")(event.target.value)}
              value={draft.aliases}
            />
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-md bg-secondary px-3 py-2.5">
            <Label htmlFor="speaker-active">
              Active
              <span className="type-caption block text-muted-foreground">
                Inactive speakers keep their past sermons but leave the lists.
              </span>
            </Label>
            <Switch
              checked={draft.active}
              id="speaker-active"
              onCheckedChange={set("active")}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button disabled={pending} form="speaker-form" type="submit">
            {speaker ? "Save" : "Add speaker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
