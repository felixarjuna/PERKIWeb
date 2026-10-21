"use client";

import { ExternalLink, Sheet } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

/** The Google Sheet the schedule import reads, changed by pasting its link. */
export default function ScheduleSheetSetting() {
  const utils = api.useUtils();
  const current = api.settings.scheduleSheet.useQuery();
  const [link, setLink] = React.useState("");
  const save = api.settings.setScheduleSheet.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      setLink("");
      await Promise.all([
        utils.settings.invalidate(),
        utils.scheduleImport.invalidate(),
      ]);
      toast.success(
        result.title ? `Connected “${result.title}”` : "Schedule sheet removed"
      );
    },
  });

  return (
    <section
      aria-labelledby="schedule-sheet-title"
      className="space-y-5 rounded-xl bg-card p-4 sm:p-6"
    >
      <div>
        <h2 className="type-subheading" id="schedule-sheet-title">
          Schedule sheet
        </h2>
        <p className="type-body-sm mt-1 text-muted-foreground">
          The Google Sheet that “Import from sheet” reads. When a new year
          starts in a new file, paste its link here. The sheet must be shared
          with “Anyone with the link”.
        </p>
      </div>

      {current.isError ? (
        <QueryMessage error onRetry={() => current.refetch()} />
      ) : null}
      {current.data ? (
        <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
          <Sheet aria-hidden="true" className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="type-body-sm break-words">
              {current.data.title ?? "Google can't open this sheet right now"}
            </p>
            <p className="type-caption text-muted-foreground">
              {current.data.updatedBy
                ? `Set by ${current.data.updatedBy} on ${DateTime.fromJSDate(current.data.updatedAt).toFormat("d LLL yyyy")}`
                : "Set when the import was added"}
            </p>
          </div>
          <a
            aria-label="Open the schedule sheet in Google Sheets"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            href={current.data.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      ) : null}
      {current.data === null ? (
        <p className="type-body-sm text-muted-foreground">
          No sheet is set, so the import is off.
        </p>
      ) : null}

      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({ link });
        }}
      >
        <Label htmlFor="schedule-sheet-link">
          {current.data ? "Use another sheet" : "Sheet link"}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="schedule-sheet-link"
            inputMode="url"
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            required
            value={link}
          />
          <Button
            className="shrink-0"
            disabled={save.isPending || link.trim() === ""}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>

      {current.data ? (
        <Button
          className="-ms-3 text-muted-foreground"
          disabled={save.isPending}
          onClick={() => save.mutate({ link: null })}
          size="sm"
          type="button"
          variant="ghost"
        >
          Remove the sheet
        </Button>
      ) : null}
    </section>
  );
}
