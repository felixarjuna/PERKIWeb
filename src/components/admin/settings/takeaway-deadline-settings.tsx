"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminSelect, QueryMessage } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import { DEADLINE_WEEKDAYS } from "~/lib/takeaway-deadline";
import { api } from "~/trpc/react";
import { SettingsGroup } from "./settings-layout";

export default function TakeawayDeadlineSettings() {
  const query = api.settings.takeawayDeadline.useQuery();
  const [selected, setSelected] = useState<string | null>(null);
  const utils = api.useUtils();
  const save = api.settings.setTakeawayDeadline.useMutation({
    onError: (error) => toast.error(error.message),
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
  return (
    <SettingsGroup title="Takeaway deadlines">
      <div>
        <p className="type-body-sm py-4 text-muted-foreground">
          Takeaways are due at the end of this weekday after each gathering, in
          Aachen time. Changes apply to all assignments immediately. Friday is
          the default.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <AdminSelect
            id="takeaway-deadline"
            label="Deadline weekday"
            onChange={setSelected}
            options={DEADLINE_WEEKDAYS}
            value={value}
          />
          <Button
            disabled={save.isPending || value === String(query.data)}
            onClick={() => save.mutate({ weekday: Number(value) })}
            type="button"
          >
            {save.isPending ? "Saving…" : "Save deadline"}
          </Button>
        </div>
      </div>
    </SettingsGroup>
  );
}
