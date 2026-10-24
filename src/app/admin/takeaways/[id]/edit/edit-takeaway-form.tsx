"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { TakeawayStatusBadges } from "~/components/admin/content/takeaway-status-badges";
import { TakeawaySuggestions } from "~/components/admin/content/takeaway-suggestions";
import { Button, buttonVariants } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { takeawayTldrSchema } from "~/lib/takeaway-tldr";
import { getUsernameFromName } from "~/lib/utils";
import { updateTakeawaySchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";
import { KeypointsField } from "../../keypoints-field";
import { TldrField } from "../../tldr-field";

const editTakeawayFormSchema = updateTakeawaySchema.extend({
  tldr: takeawayTldrSchema,
});
type EditTakeawayValues = z.infer<typeof editTakeawayFormSchema>;

export default function EditTakeawayForm() {
  const { data: session } = useSession();
  const username = React.useMemo(
    () => getUsernameFromName(session?.user.name ?? ""),
    [session?.user.name]
  );

  const router = useRouter();

  const { id } = useParams<{ id: string }>();
  const takeawayId = Number.parseInt(id, 10);
  const { data: takeaway } = api.takeaways.getTakeawayById.useQuery({
    id: takeawayId,
  });
  // A published takeaway is edited through its correction (#74).
  const { data: revision, isSuccess: revisionLoaded } =
    api.takeawayRevisions.current.useQuery({ takeawayId });
  const published = takeaway?.takeaways.status === "published";

  /** form definition. */
  const form = useForm<EditTakeawayValues>({
    resolver: zodResolver(editTakeawayFormSchema),
  });

  /**
   * Load the takeaway into the form once. Resetting again when the session
   * arrives or the query refetches would wipe what the writer just typed.
   */
  const loadedId = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (
      !(takeaway && revisionLoaded) ||
      loadedId.current === takeaway.takeaways.id
    ) {
      return;
    }
    loadedId.current = takeaway.takeaways.id;
    const text = revision ?? takeaway.takeaways;
    form.reset({
      ...takeaway.takeaways,
      contributors: text.contributors as string[],
      keypoints: text.keypoints,
      tldr: text.tldr ?? "",
    });
  }, [form, revision, revisionLoaded, takeaway]);
  const savedTldr = (revision ?? takeaway?.takeaways)?.tldr ?? "";

  /** edit takeaway action. */
  const utils = api.useUtils();
  const saveTldr = api.takeawayTldr.save.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const updateTakeaway = api.takeaways.updateTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.takeaways.getManageable.cancel();
      await Promise.all([
        utils.takeaways.invalidate(),
        utils.takeawayRevisions.invalidate(),
      ]);
      toast.success(
        published
          ? "Changes saved."
          : "Your changes has been saved successfully!",
        {
          description: published
            ? "The website keeps the published text until mita publishes your changes."
            : "Thanks for your contribution!",
        }
      );
      router.push("/admin/takeaways");
    },
  });

  /** Credits whoever saves, once the session has their name. */
  async function onSubmit({ tldr, ...values }: EditTakeawayValues) {
    const contributors =
      username && !values.contributors.includes(username)
        ? [...values.contributors, username]
        : values.contributors;
    if (tldr !== savedTldr) {
      try {
        await saveTldr.mutateAsync({ id: values.id, tldr });
      } catch {
        return;
      }
    }
    updateTakeaway.mutate({ ...values, contributors });
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-3xl flex-col gap-8"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="type-heading">Fellowship Information</h2>
            {takeaway ? (
              <TakeawayStatusBadges
                revision={revision?.status}
                status={takeaway.takeaways.status}
              />
            ) : null}
          </div>
          {published ? (
            <p
              className="type-body-sm rounded-xl bg-card p-4 text-muted-foreground sm:p-6"
              data-slot="revision-notice"
            >
              This takeaway is published. Your changes are saved separately and
              go through review; the website keeps the published text until mita
              publishes them.
            </p>
          ) : null}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="takeaway-schedule">Schedule</Label>
              <Input
                disabled
                id="takeaway-schedule"
                value={takeaway?.schedules?.title}
              />
            </div>

            <div className="sm:col-span-2">
              <TldrField control={form.control} name="tldr" />
            </div>

            <div className="sm:col-span-2">
              <KeypointsField control={form.control} name="keypoints" />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={updateTakeaway.isPending || saveTldr.isPending}
              type="submit"
            >
              <Save aria-hidden="true" data-icon="inline-start">
                <title>Save changes</title>
              </Save>
              Save changes
            </Button>
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/admin/takeaways"
            >
              Cancel
            </Link>
          </div>
          <p className="type-caption text-muted-foreground">
            {published
              ? "Send your changes to review from the takeaways list."
              : "Saving keeps the status. Change it from the takeaways list."}
          </p>
        </div>
      </form>
      {/* Accepting replaces the saved text, so unsaved edits come first. */}
      <TakeawaySuggestions
        acceptBlocked={
          form.formState.isDirty
            ? "Save your changes before accepting a suggestion."
            : undefined
        }
        onAccepted={(keypoints) =>
          form.reset({ ...form.getValues(), keypoints })
        }
        takeawayId={takeawayId}
      />
    </Form>
  );
}
