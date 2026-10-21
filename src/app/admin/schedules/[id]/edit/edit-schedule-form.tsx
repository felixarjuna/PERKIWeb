"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { addScheduleSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";
import { ScheduleFields, type ScheduleValues } from "../../schedule-fields";

export default function EditScheduleForm() {
  const router = useRouter();
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number.parseInt(idParam, 10);
  const { data: schedule } = api.schedules.getScheduleById.useQuery({ id });

  const form = useForm<ScheduleValues>({
    resolver: zodResolver(addScheduleSchema),
  });

  React.useEffect(() => {
    if (schedule) {
      form.reset({
        ...schedule,
        accommodation: schedule.accommodation ?? undefined,
        cookingGroup: schedule.cookingGroup ?? undefined,
        multimedia: schedule.multimedia ?? undefined,
        preacher: schedule.preacher ?? undefined,
      });
    }
  }, [form, schedule]);

  const utils = api.useUtils();
  const updateSchedule = api.schedules.updateSchedule.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await Promise.all([
        utils.schedules.invalidate(),
        utils.takeaways.invalidate(),
      ]);
      toast.success("Schedule updated successfully!", {
        description: "Thanks for your contributions!",
      });
      router.push("/admin/schedules");
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((values) =>
          updateSchedule.mutate({ ...values, id })
        )}
      >
        <ScheduleFields form={form} />
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={updateSchedule.isPending} type="submit">
            Save changes
          </Button>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href="/admin/schedules"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  );
}
