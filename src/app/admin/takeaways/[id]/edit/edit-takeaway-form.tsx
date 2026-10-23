"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { takeawayBadgeStyles } from "~/lib/takeaway-badge-styles";
import { statusLabels } from "~/lib/takeaway-status";
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
  const { data: takeaway } = api.takeaways.getTakeawayById.useQuery({
    id: Number.parseInt(id, 10),
  });

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
    if (!takeaway || loadedId.current === takeaway.takeaways.id) {
      return;
    }
    loadedId.current = takeaway.takeaways.id;
    form.reset({
      ...takeaway.takeaways,
      contributors: takeaway.takeaways.contributors as string[],
      tldr: takeaway.takeaways.tldr ?? "",
    });
  }, [form, takeaway]);

  /** edit takeaway action. */
  const utils = api.useUtils();
  const saveTldr = api.takeawayTldr.save.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const updateTakeaway = api.takeaways.updateTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.takeaways.getManageable.cancel();
      await utils.takeaways.invalidate();
      toast.success("Your changes has been saved successfully!", {
        description: "Thanks for your contribution!",
      });
      router.push("/admin/takeaways");
    },
  });

  /** Credits whoever saves, once the session has their name. */
  async function onSubmit({ tldr, ...values }: EditTakeawayValues) {
    const contributors =
      username && !values.contributors.includes(username)
        ? [...values.contributors, username]
        : values.contributors;
    if (tldr !== (takeaway?.takeaways.tldr ?? "")) {
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
              <Badge
                data-slot="takeaway-status"
                size="status"
                {...takeawayBadgeStyles[takeaway.takeaways.status]}
              >
                {statusLabels[takeaway.takeaways.status]}
              </Badge>
            ) : null}
          </div>
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={updateTakeaway.isPending || saveTldr.isPending}
              type="submit"
              variant="default"
            >
              <Save aria-hidden="true" data-icon="inline-start">
                <title>Save changes</title>
              </Save>
              Save changes
            </Button>
            <p className="type-caption text-muted-foreground">
              Saving keeps the status. Change it from the takeaways list.
            </p>
          </div>
          <Button
            className="flex gap-x-2"
            onClick={() => router.push("/admin/takeaways")}
            type="button"
            variant="secondary"
          >
            <ArrowLeft aria-hidden="true" data-icon="inline-start">
              <title>Back</title>
            </ArrowLeft>
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
