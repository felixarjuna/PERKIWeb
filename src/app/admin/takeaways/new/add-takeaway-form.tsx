"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
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
import { api } from "~/trpc/react";
import { KeypointsField } from "../keypoints-field";

type NewStatus = "draft" | "in_review";

const addTakeawayFormSchema = z.object({
  contributors: z.array(z.string()),
  keypoints: z.string(),
  scheduleId: z.string(),
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
    },
    resolver: zodResolver(addTakeawayFormSchema),
  });

  /** Which button submitted: a draft only the writer sees, or one for review. */
  const [status, setStatus] = useState<NewStatus>("draft");

  /** add takeaway action. */
  const utils = api.useUtils();
  const addTakeaway = api.takeaways.addTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (created) => {
      await Promise.all([utils.takeaways.invalidate()]);
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

  function onSubmit(values: z.infer<typeof addTakeawayFormSchema>) {
    addTakeaway.mutate({
      ...values,
      scheduleId: +values.scheduleId,
      status,
    });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={form.handleSubmit(onSubmit, (error) => {
          toast.error("Uh oh! Something went wrong.", {
            description: JSON.stringify(error),
          });
        })}
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
                      The schedule on which the keypoints should be based
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
              <KeypointsField control={form.control} name="keypoints" />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={addTakeaway.isPending}
              onClick={() => setStatus("draft")}
              type="submit"
              variant="default"
            >
              Save draft
            </Button>
            <Button
              disabled={addTakeaway.isPending}
              onClick={() => setStatus("in_review")}
              type="submit"
              variant="secondary"
            >
              Send to review
            </Button>
          </div>
          <Button
            className="flex gap-x-2"
            onClick={() => router.push("/admin/takeaways")}
            type="button"
            variant="secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
