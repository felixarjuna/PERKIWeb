"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ProfileFieldInput, {
  saveInputOf,
} from "~/components/profile-field-input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  PROFILE_FIELDS,
  type ProfileField,
  profileFieldLabels,
  profileFieldReasons,
} from "~/lib/profile-completion";
import { api } from "~/trpc/react";

const EMPTY = Object.fromEntries(
  PROFILE_FIELDS.map((field) => [field, ""])
) as Record<ProfileField, string>;

/** The one-time welcome step: the five details, all optional, or skip. */
export default function WelcomeForm({ returnPath }: { returnPath: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [drafts, setDrafts] = useState(EMPTY);
  const goOn = async () => {
    await utils.profiles.invalidate();
    router.replace(returnPath);
  };
  const onError = (error: { message: string }) =>
    toast.error("Couldn't save", { description: error.message });
  const save = api.profiles.saveMine.useMutation({
    onError,
    onSuccess: async () => {
      toast.success("Thank you! Your details are saved.");
      await goOn();
    },
  });
  const skip = api.profiles.markWelcomeSeen.useMutation({
    onError,
    onSuccess: goOn,
  });
  const pending = save.isPending || skip.isPending;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const input = Object.assign(
          {},
          ...PROFILE_FIELDS.filter((field) => drafts[field].trim()).map(
            (field) => saveInputOf(field, drafts[field])
          )
        );
        if (Object.keys(input).length) {
          save.mutate(input);
        } else {
          skip.mutate();
        }
      }}
    >
      <div className="flex flex-col gap-5 rounded-xl bg-card p-4 sm:p-6">
        {PROFILE_FIELDS.map((field) => {
          const id = `welcome-${field}`;
          return (
            <div className="flex flex-col gap-2" key={field}>
              <Label htmlFor={id}>{profileFieldLabels[field]}</Label>
              <ProfileFieldInput
                field={field}
                id={id}
                onChange={(value) =>
                  setDrafts((current) => ({ ...current, [field]: value }))
                }
                value={drafts[field]}
              />
              <p className="type-caption text-muted-foreground">
                {profileFieldReasons[field]}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <Button disabled={pending} type="submit">
          {save.isPending ? "Saving…" : "Save and continue"}
        </Button>
        <Button
          disabled={pending}
          onClick={() => skip.mutate()}
          type="button"
          variant="ghost"
        >
          Skip for now
        </Button>
      </div>
    </form>
  );
}
