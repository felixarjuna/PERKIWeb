"use client";

import { Send } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import PrayerForm from "~/components/prayer/prayer-form";
import { api } from "~/trpc/react";

/** The server credits the request to the signed-in person. */
export default function AddPrayerForm({
  onAdded,
  secondaryAction,
}: {
  /** Called after a successful submit, e.g. to close a dialog. */
  onAdded?: () => void;
  secondaryAction?: ReactNode;
}) {
  const utils = api.useUtils();
  const addPrayer = api.prayers.addPrayer.useMutation();
  return (
    <PrayerForm
      onSubmit={async ({ content, isAnonymous }) => {
        try {
          await addPrayer.mutateAsync({ content, isAnonymous });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Something went wrong."
          );
          return false;
        }
        await utils.prayers.invalidate();
        toast.success("Your prayer is submitted!", {
          description: "Your request is private until reviewed and published.",
        });
        onAdded?.();
        return true;
      }}
      pending={addPrayer.isPending}
      secondaryAction={secondaryAction}
      submitIcon={<Send aria-hidden="true" />}
      submitLabel="Submit request"
    />
  );
}
