"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getUsernameFromName } from "~/lib/utils";
import { updateTakeawaySchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";
import { KeypointsField } from "../../keypoints-field";

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

  const contributors = React.useMemo(() => {
    if (takeaway) {
      const _contributors = takeaway.takeaways.contributors as string[];
      return _contributors.includes(username)
        ? [..._contributors]
        : [..._contributors, username];
    }
  }, [takeaway, username]);

  /** form definition. */
  const form = useForm<z.infer<typeof updateTakeawaySchema>>({
    resolver: zodResolver(updateTakeawaySchema),
  });

  /** load form data. */
  React.useEffect(() => {
    form.reset({
      ...takeaway?.takeaways,
      contributors,
    });
  }, [contributors, form, takeaway]);

  /** edit takeaway action. */
  const utils = api.useUtils();
  const updateTakeaway = api.takeaways.updateTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await Promise.all([utils.takeaways.invalidate()]);
      toast.success("Your changes has been saved successfully!", {
        description: "Thanks for your contribution!",
      });
      router.push("/admin/takeaways");
    },
  });

  function onSubmit(values: z.infer<typeof updateTakeawaySchema>) {
    updateTakeaway.mutate(values);
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="takeaway-schedule">Schedule</Label>
              <Input
                disabled
                id="takeaway-schedule"
                value={takeaway?.schedules?.title}
              />
            </div>

            <div className="sm:col-span-2">
              <KeypointsField control={form.control} name="keypoints" />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            disabled={updateTakeaway.isPending}
            type="submit"
            variant={"default"}
          >
            Save changes
          </Button>
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
