"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { takeawayKeypointsSchema } from "~/lib/takeaway-content";
import { takeawayTldrSchema } from "~/lib/takeaway-tldr";
import { api } from "~/trpc/react";
import { KeypointsField } from "../keypoints-field";
import { TldrField } from "../tldr-field";

type NewStatus = "draft" | "in_review";

const addTakeawayFormSchema = z.object({
  contributors: z.array(z.string()),
  keypoints: takeawayKeypointsSchema,
  scheduleId: z.string().min(1, "Choose a gathering for this takeaway."),
  tldr: takeawayTldrSchema,
});

/** `username` comes from the server session, so it is set on first render. */
export default function AddTakeawayForm({ username }: { username: string }) {
  /** loading schedule selection. */
  const { data: schedules } = api.schedules.options.useQuery();

  /** toast and router. */
  const router = useRouter();

  /** form definition. */
  const form = useForm<z.infer<typeof addTakeawayFormSchema>>({
    defaultValues: {
      contributors: [username],
      keypoints: "",
      scheduleId: "",
      tldr: "",
    },
    resolver: zodResolver(addTakeawayFormSchema),
  });

  /** add takeaway action. */
  const utils = api.useUtils();
  const saveTldr = api.takeawayTldr.save.useMutation();
  const addTakeaway = api.takeaways.addTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (created) => {
      const tldr = form.getValues("tldr");
      if (tldr.trim()) {
        try {
          await saveTldr.mutateAsync({ id: created.id, tldr });
        } catch (error) {
          // The takeaway exists; its TL;DR can still be added when editing.
          toast.error(
            error instanceof Error ? error.message : "Could not save the TL;DR."
          );
        }
      }
      await utils.takeaways.getManageable.cancel();
      await utils.takeaways.invalidate();
      toast.success(
        created.status === "in_review"
          ? "Your takeaway is in review."
          : "Your draft has been saved.",
        {
          description:
            created.status === "in_review"
              ? "Mita or the owner will publish it."
              : "Send it to review when it is ready.",
        }
      );
      router.push("/admin/takeaways");
    },
  });

  function onSubmit(
    { tldr: _tldr, ...values }: z.infer<typeof addTakeawayFormSchema>,
    status: NewStatus
  ) {
    addTakeaway.mutate({
      ...values,
      scheduleId: +values.scheduleId,
      status,
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-3xl flex-col gap-8"
        onSubmit={(event) => {
          const { submitter } = event.nativeEvent as SubmitEvent;
          const status =
            submitter instanceof HTMLButtonElement &&
            submitter.value === "in_review"
              ? "in_review"
              : "draft";
          return form.handleSubmit((values) => onSubmit(values, status))(event);
        }}
      >
        <div className="space-y-4">
          <h2 className="type-heading">Fellowship Information</h2>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="scheduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <FormDescription className="type-caption">
                      The gathering these notes are from
                    </FormDescription>
                    <FormControl>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schedules?.map((schedule) => (
                            <SelectItem
                              key={schedule.id}
                              value={schedule.id.toString()}
                            >
                              {schedule.title
                                .toLowerCase()
                                .includes("exposition")
                                ? `${schedule.title} - ${schedule.bibleVerse}`
                                : schedule.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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

        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={addTakeaway.isPending || saveTldr.isPending}
            name="intent"
            type="submit"
            value="draft"
            variant="secondary"
          >
            <Save aria-hidden="true" data-icon="inline-start">
              <title>Save draft</title>
            </Save>
            Save draft
          </Button>
          <Button
            disabled={addTakeaway.isPending || saveTldr.isPending}
            name="intent"
            type="submit"
            value="in_review"
            variant="default"
          >
            <Send aria-hidden="true" data-icon="inline-start">
              <title>Send to review</title>
            </Send>
            Send to review
          </Button>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href="/admin/takeaways"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  );
}
