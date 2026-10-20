"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { getUsernameFromName } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import PrayerForm from "./prayer-form";

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerForm({
  prayer,
  onCloseDialog,
}: {
  prayer: Prayer;
  onCloseDialog: () => void;
}) {
  const { data: session } = useSession();
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
            ...prayer,
            content,
            isAnonymous,
            name: prayer.name ?? getUsernameFromName(session?.user.name ?? ""),
            prayerNames: prayer.prayerNames as string[],
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
