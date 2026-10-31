"use client";

import { Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
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
import { api, type RouterOutputs } from "~/trpc/react";
import { changedBy, OpenLink } from "./open-link";
import { SettingRow, SettingsGroup } from "./settings-layout";

type Source = RouterOutputs["settings"]["takeawaySources"]["sources"][number];

/** `null` adds a source; a source edits it. */
type Editing = Source | null | undefined;

function SourceDialog({
  editing,
  onClose,
}: {
  editing: Editing;
  onClose: () => void;
}) {
  const id = React.useId();
  const utils = api.useUtils();
  const [label, setLabel] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [tldr, setTldr] = React.useState("");
  const open = editing !== undefined;
  React.useEffect(() => {
    if (editing !== undefined) {
      setLabel(editing?.label ?? "");
      setNotes(editing?.notes.url ?? "");
      setTldr(editing?.tldr?.url ?? "");
    }
  }, [editing]);
  const done = (message: string) => async () => {
    onClose();
    await Promise.all([
      utils.settings.takeawaySources.invalidate(),
      utils.takeawayImport.invalidate(),
    ]);
    toast.success(message);
  };
  const onError = (error: { message: string }) => toast.error(error.message);
  const save = api.settings.saveTakeawaySource.useMutation({
    onError,
    onSuccess: (_result, input) => done(`“${input.label.trim()}” saved`)(),
  });
  const remove = api.settings.removeTakeawaySource.useMutation({
    onError,
    onSuccess: done("Source removed"),
  });
  const pending = save.isPending || remove.isPending;

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit “${editing.label}”` : "Add a source"}
          </DialogTitle>
          <DialogDescription>
            Paste the links from the browser. They're saved only if Google can
            open them, so share both documents with “Anyone with the link”.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          id={`${id}-form`}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing?.id ?? null, label, notes, tldr });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`${id}-label`}>Name</Label>
            <Input
              autoFocus
              id={`${id}-label`}
              maxLength={40}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="2026"
              required
              value={label}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-notes`}>Notes document</Label>
            <Input
              id={`${id}-notes`}
              inputMode="url"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="https://docs.google.com/document/d/…"
              required
              value={notes}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-tldr`}>TL;DR document (optional)</Label>
            <Input
              id={`${id}-tldr`}
              inputMode="url"
              onChange={(event) => setTldr(event.target.value)}
              placeholder="https://docs.google.com/document/d/…"
              value={tldr}
            />
          </div>
        </form>
        <DialogFooter className="sm:justify-between">
          {editing ? (
            <Button
              className="text-muted-foreground"
              disabled={pending}
              onClick={() => remove.mutate({ id: editing.id })}
              type="button"
              variant="ghost"
            >
              Remove source
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={pending || label.trim() === "" || notes.trim() === ""}
              form={`${id}-form`}
              type="submit"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Settings → Takeaways: the notes and TL;DR documents "Import from Docs"
 * reads, one pair per source (usually one per year).
 */
export default function TakeawaySourceSettings() {
  const query = api.settings.takeawaySources.useQuery();
  const [editing, setEditing] = React.useState<Editing>(undefined);

  if (query.isError) {
    return <QueryMessage error onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <QueryMessage>Loading sources…</QueryMessage>;
  }
  const { changed, sources } = query.data;

  return (
    <>
      <SettingsGroup title="Import from Docs">
        <SettingRow
          description={
            <>
              The documents writers keep their notes and TL;DRs in, one pair per
              source. “Import from Docs” on Add takeaway asks which one to read.
              {changed ? changedBy(changed) : ""}
            </>
          }
          title="Sources"
        >
          <Button
            onClick={() => setEditing(null)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add source
          </Button>
        </SettingRow>
        {sources.length === 0 ? (
          <p className="type-body-sm py-4 text-muted-foreground">
            No sources yet, so the import is off.
          </p>
        ) : null}
        {sources.map((source) => (
          <SettingRow
            description={
              source.tldr ? "Notes and TL;DR" : "Notes only, no TL;DR document"
            }
            key={source.id}
            title={source.label}
          >
            <OpenLink href={source.notes.url} label="Notes" />
            {source.tldr ? (
              <OpenLink href={source.tldr.url} label="TL;DR" />
            ) : null}
            <Button
              aria-label={`Edit the source ${source.label}`}
              onClick={() => setEditing(source)}
              size="sm"
              type="button"
              variant="secondary"
            >
              Edit
            </Button>
          </SettingRow>
        ))}
      </SettingsGroup>
      <SourceDialog editing={editing} onClose={() => setEditing(undefined)} />
    </>
  );
}
