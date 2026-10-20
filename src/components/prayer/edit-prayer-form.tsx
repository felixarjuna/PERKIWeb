"use client";

import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import PrayerForm from "./prayer-form";

/** The fields an edit needs, from the admin list or the author's own list. */
export interface EditablePrayer {
  content: string;
  id: number;
  isAnonymous: boolean | null;
}

export default function EditPrayerForm({
  prayer,
  onCloseDialog,
}: {
  prayer: EditablePrayer;
  onCloseDialog: () => void;
}) {
  const utils = api.useUtils();
  const updatePrayer = api.prayers.updatePrayer.useMutation();
  return (
    <PrayerForm
      defaultValues={{
        content: prayer.content,
        isAnonymous: prayer.isAnonymous ?? false,
      }}
      onSubmit={async ({ content, isAnonymous }) => {
        try {
          await updatePrayer.mutateAsync({
            content,
            id: prayer.id,
            isAnonymous,
          });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Something went wrong."
          );
          return false;
        }
        await utils.prayers.invalidate();
        toast.success("Prayer request updated.");
        onCloseDialog();
        return false;
      }}
      pending={updatePrayer.isPending}
      secondaryAction={
        <Button onClick={onCloseDialog} type="button" variant="ghost">
          Cancel
        </Button>
      }
      submitLabel="Save changes"
    />
  );
}
