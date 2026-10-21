"use client";

import { ExternalLink } from "lucide-react";
import { DateTime } from "luxon";
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
import { api } from "~/trpc/react";
import { SettingRow, SettingsGroup } from "./settings-layout";

interface Change {
  updatedAt: Date | null;
  updatedBy: string | null;
}

const changedBy = ({ updatedAt, updatedBy }: Change) =>
  updatedAt
    ? ` Changed${updatedBy ? ` by ${updatedBy}` : ""} on ${DateTime.fromJSDate(updatedAt).toFormat("d LLL yyyy")}.`
    : "";

function OpenLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="type-body-sm inline-flex max-w-64 items-center gap-1.5 truncate rounded-md px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span className="truncate">{label}</span>
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
    </a>
  );
}

/** Edits one link setting: paste, save, and optionally remove or reset. */
function LinkDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  onSave,
  remove,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  onSave: (link: string) => void;
  remove?: { label: string; onRemove: () => void };
  pending: boolean;
}) {
  const [link, setLink] = React.useState("");
  const id = React.useId();
  React.useEffect(() => {
    if (open) {
      setLink("");
    }
  }, [open]);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          id={`${id}-form`}
          onSubmit={(event) => {
            event.preventDefault();
            onSave(link);
          }}
        >
          <Label htmlFor={id}>Link</Label>
          <Input
            autoFocus
            id={id}
            inputMode="url"
            onChange={(event) => setLink(event.target.value)}
            placeholder={placeholder}
            required
            value={link}
          />
        </form>
        <DialogFooter className="gap-2 sm:justify-between">
          {remove ? (
            <Button
              className="text-muted-foreground"
              disabled={pending}
              onClick={remove.onRemove}
              type="button"
              variant="ghost"
            >
              {remove.label}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              disabled={pending || link.trim() === ""}
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

type Editing = "discord" | "drive" | "sheet" | "whatsapp" | null;

/** Settings → Integrations: the outside services the workspace links to. */
export default function IntegrationSettings() {
  const utils = api.useUtils();
  const query = api.settings.integrations.useQuery();
  const [editing, setEditing] = React.useState<Editing>(null);
  const done = (message: string) => async () => {
    setEditing(null);
    await Promise.all([
      utils.settings.invalidate(),
      utils.scheduleImport.invalidate(),
    ]);
    toast.success(message);
  };
  const onError = (error: { message: string }) => toast.error(error.message);
  const sheet = api.settings.setScheduleSheet.useMutation({
    onError,
    onSuccess: (result) =>
      done(
        result.title ? `Connected “${result.title}”` : "Schedule sheet removed"
      )(),
  });
  const drive = api.settings.setDriveFolder.useMutation({
    onError,
    onSuccess: done("Drive folder saved"),
  });
  const discord = api.settings.setDiscordInvite.useMutation({
    onError,
    onSuccess: done("Discord invite saved"),
  });
  const whatsapp = api.settings.setWhatsappGroup.useMutation({
    onError,
    onSuccess: done("WhatsApp group link saved"),
  });

  if (query.isError) {
    return <QueryMessage error onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <QueryMessage>Loading settings…</QueryMessage>;
  }
  const { discordInvite, driveFolder, scheduleSheet, whatsappGroup } =
    query.data;
  const close = (open: boolean) => {
    if (!open) {
      setEditing(null);
    }
  };

  return (
    <>
      <SettingsGroup title="Google">
        <SettingRow
          description={
            <>
              The sheet “Import from sheet” reads. Paste the new file's link
              when a new year starts.
              {scheduleSheet ? changedBy(scheduleSheet) : ""}
            </>
          }
          title="Schedule sheet"
        >
          {scheduleSheet ? (
            <OpenLink
              href={scheduleSheet.url}
              label={scheduleSheet.title ?? "Sheet can't be opened right now"}
            />
          ) : (
            <span className="type-body-sm text-muted-foreground">
              Not set, so the import is off
            </span>
          )}
          <Button
            aria-label="Change the schedule sheet"
            onClick={() => setEditing("sheet")}
            size="sm"
            type="button"
            variant="secondary"
          >
            {scheduleSheet ? "Change" : "Add"}
          </Button>
        </SettingRow>
        <SettingRow
          description={
            <>
              Shown to mita in the sidebar; writers see it greyed out.
              {driveFolder?.fromEnvironment
                ? " Still read from the server's DRIVE_FOLDER_URL; save it here to manage it from now on."
                : ""}
              {driveFolder ? changedBy(driveFolder) : ""}
            </>
          }
          title="Drive folder"
        >
          {driveFolder ? (
            <OpenLink href={driveFolder.url} label="Open folder" />
          ) : (
            <span className="type-body-sm text-muted-foreground">
              Not set, so it's hidden
            </span>
          )}
          <Button
            aria-label="Change the Drive folder"
            onClick={() => setEditing("drive")}
            size="sm"
            type="button"
            variant="secondary"
          >
            {driveFolder ? "Change" : "Add"}
          </Button>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Discord">
        <SettingRow
          description={
            <>
              Used by “Join our Discord” on the home page and in the sidebar.
              {discordInvite.isDefault
                ? " This is the default invite."
                : changedBy(discordInvite)}
            </>
          }
          title="Invite link"
        >
          <OpenLink
            href={discordInvite.url}
            label={discordInvite.url.replace("https://", "")}
          />
          <Button
            aria-label="Change the Discord invite"
            onClick={() => setEditing("discord")}
            size="sm"
            type="button"
            variant="secondary"
          >
            Change
          </Button>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="WhatsApp">
        <SettingRow
          description={
            <>
              Members see “Join the WhatsApp group” on their profile once all
              their details are filled in. Never shown publicly.
              {whatsappGroup ? changedBy(whatsappGroup) : ""}
            </>
          }
          title="Group link"
        >
          {whatsappGroup ? (
            <OpenLink
              href={whatsappGroup.url}
              label={whatsappGroup.url.replace("https://", "")}
            />
          ) : (
            <span className="type-body-sm text-muted-foreground">
              Not set, so members don't see the group
            </span>
          )}
          <Button
            aria-label="Change the WhatsApp group link"
            onClick={() => setEditing("whatsapp")}
            size="sm"
            type="button"
            variant="secondary"
          >
            {whatsappGroup ? "Change" : "Add"}
          </Button>
        </SettingRow>
      </SettingsGroup>

      <LinkDialog
        description="Paste the link from the browser. It's saved only if Google can open it, so the sheet must be shared with “Anyone with the link”."
        onOpenChange={close}
        onSave={(link) => sheet.mutate({ link })}
        open={editing === "sheet"}
        pending={sheet.isPending}
        placeholder="https://docs.google.com/spreadsheets/d/…"
        remove={
          scheduleSheet
            ? {
                label: "Remove sheet",
                onRemove: () => sheet.mutate({ link: null }),
              }
            : undefined
        }
        title="Schedule sheet"
      />
      <LinkDialog
        description="The shared folder mita open from the sidebar."
        onOpenChange={close}
        onSave={(link) => drive.mutate({ link })}
        open={editing === "drive"}
        pending={drive.isPending}
        placeholder="https://drive.google.com/drive/folders/…"
        remove={
          driveFolder && !driveFolder.fromEnvironment
            ? {
                label: "Remove folder",
                onRemove: () => drive.mutate({ link: null }),
              }
            : undefined
        }
        title="Drive folder"
      />
      <LinkDialog
        description="An invite that doesn't expire works best (Discord → Invite people → Edit invite link → Expire after: Never)."
        onOpenChange={close}
        onSave={(link) => discord.mutate({ link })}
        open={editing === "discord"}
        pending={discord.isPending}
        placeholder="https://discord.gg/…"
        remove={
          discordInvite.isDefault
            ? undefined
            : {
                label: "Use the default",
                onRemove: () => discord.mutate({ link: null }),
              }
        }
        title="Discord invite"
      />
      <LinkDialog
        description="In WhatsApp: group info → Invite via link → Copy link."
        onOpenChange={close}
        onSave={(link) => whatsapp.mutate({ link })}
        open={editing === "whatsapp"}
        pending={whatsapp.isPending}
        placeholder="https://chat.whatsapp.com/…"
        remove={
          whatsappGroup
            ? {
                label: "Remove link",
                onRemove: () => whatsapp.mutate({ link: null }),
              }
            : undefined
        }
        title="WhatsApp group"
      />
    </>
  );
}
