"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { startOn } from "~/lib/schedule-team";
import { addScheduleSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";
import { ScheduleFields, type ScheduleValues } from "../schedule-fields";
import ScheduleImport from "./schedule-import";

/** A `yyyy-MM-dd` day at the default start in Aachen, if it's a real date. */
function startOfDay(day: string | undefined) {
  const parsed = day ? DateTime.fromISO(day) : null;
  return parsed?.isValid
    ? startOn({ day: parsed.day, month: parsed.month, year: parsed.year })
    : undefined;
}

function ManualSchedule({ day }: { day?: string }) {
  const form = useForm<ScheduleValues>({
    defaultValues: { date: startOfDay(day) },
    resolver: zodResolver(addScheduleSchema),
  });

  const router = useRouter();
  const utils = api.useUtils();
  const addSchedule = api.schedules.addSchedule.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await Promise.all([
        utils.schedules.invalidate(),
        utils.takeaways.invalidate(),
      ]);
      toast.success("New schedule added!", {
        description: "Thanks for your contributions!",
      });
      router.push("/admin/schedules");
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((values) => addSchedule.mutate(values))}
      >
        <ScheduleFields form={form} />
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={addSchedule.isPending} type="submit">
            Add schedule
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

export default function AddScheduleForm({
  day,
  importing = false,
}: {
  day?: string;
  /** Opened from "Import from sheet" (`?tab=import`). */
  importing?: boolean;
}) {
  return (
    <Tabs
      className="w-full"
      defaultValue={importing ? "spreadsheet" : "manual"}
    >
      <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-fit">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="spreadsheet">Import from sheet</TabsTrigger>
      </TabsList>
      <TabsContent value="manual">
        <ManualSchedule day={day} />
      </TabsContent>
      <TabsContent value="spreadsheet">
        <ScheduleImport />
      </TabsContent>
    </Tabs>
  );
}
