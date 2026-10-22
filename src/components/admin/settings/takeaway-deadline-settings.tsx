"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminSelect, QueryMessage } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import { DEADLINE_WEEKDAYS } from "~/lib/takeaway-deadline";
import { api } from "~/trpc/react";

export default function TakeawayDeadlineSettings() {
  const query = api.settings.takeawayDeadline.useQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const utils = api.useUtils();
  const save = api.settings.setTakeawayDeadline.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.settings.takeawayDeadline.invalidate(),
        utils.writerAssignments.invalidate(),
      ]);
      setSelected(null);
      toast.success("Takeaway deadline saved.");
    },
  });
  if (query.isLoading) {
    return <QueryMessage>Loading deadline…</QueryMessage>;
  }
  if (query.isError) {
    return (
      <QueryMessage
        error
        onRetry={() => {
          query.refetch();
        }}
      />
    );
  }
  const value = selected ?? String(query.data);
  const changed = value !== String(query.data);
  let feedback = "No unsaved changes";
  if (save.isPending) {
    feedback = "Saving deadline…";
  } else if (changed) {
    feedback = "Unsaved changes";
  } else if (save.isSuccess) {
    feedback = "Deadline saved";
  }
  return (
    <form
      aria-label="Takeaway deadlines"
      className="max-w-xl rounded-xl bg-card p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (changed && !save.isPending) {
          save.mutate({ weekday: Number(value) });
        }
      }}
    >
      <div className="space-y-5">
        <div>
          <h3 className="type-body">Weekly deadline</h3>
          <p className="type-body-sm mt-1 text-muted-foreground">
            Due by the end of the next chosen weekday after each gathering, in
            Aachen time.
          </p>
        </div>
        <fieldset className="min-w-0 space-y-2" disabled={save.isPending}>
          <AdminSelect
            className="w-full [&_button]:min-h-11"
            id="takeaway-deadline"
            label="Deadline weekday"
            onChange={(next) => {
              setSelected(next);
              save.reset();
            }}
            options={DEADLINE_WEEKDAYS}
            value={value}
          />
          <p className="type-caption text-muted-foreground">
            Friday by default. Applies to all assignments when saved.
          </p>
        </fieldset>
        {save.isError ? (
          <p className="type-body-sm text-destructive-text" role="alert">
            Deadline not saved. Check your connection and try saving again.
          </p>
        ) : null}
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-caption text-muted-foreground" role="status">
            {feedback}
          </p>
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={save.isPending || !changed}
            type="submit"
          >
            {save.isPending ? "Saving deadline…" : "Save deadline"}
          </Button>
        </div>
      </div>
    </form>
  );
}
