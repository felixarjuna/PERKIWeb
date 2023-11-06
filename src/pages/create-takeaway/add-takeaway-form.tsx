"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { getUsernameFromName } from "~/lib/utils";

import { api } from "~/utils/api";

const addTakeawayFormSchema = z.object({
  scheduleTitle: z.string(),
  keypoints: z.string(),
  contributors: z.array(z.string()),
});

export default function AddTakeawayForm() {
  const { data: session } = useSession();
  const username = React.useMemo(
    () => getUsernameFromName(session?.user.name ?? ""),
    [session?.user.name],
  );

  const { data: schedules } = api.schedules.getSchedules.useQuery();

  const { toast } = useToast();
  const router = useRouter();

  const addTakeaway = api.takeaways.addTakeaway.useMutation({
    onSuccess: async () => {
      toast({
        title: "Your takeaway has been submitted! ✨",
        description: "Thanks for sharing!",
      });
      await router.push("/takeaway");
    },
  });

  // 1. Define form.
  const form = useForm<z.infer<typeof addTakeawayFormSchema>>({
    resolver: zodResolver(addTakeawayFormSchema),
    defaultValues: {
      // TODO: Automatically take contributors name from the username
      contributors: [username],
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof addTakeawayFormSchema>) {
    const scheduleId = schedules?.find(
      (schedule) => schedule.title === values.scheduleTitle,
    )?.id;
    if (scheduleId === undefined) return;
    addTakeaway.mutate({ ...values, scheduleId });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="mt-8 space-y-8 xs:mt-4"
      >
        <div className="space-y-4">
          <h3 className="font-reimbrandt text-3xl xs:text-2xl">
            Fellowship Information
          </h3>
          <section className="grid grid-cols-2 gap-4 xs:text-sm">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="scheduleTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Schedule</FormLabel>
                    <FormDescription className="text-xs">
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
                          {schedules?.map((schedule, index) => (
                            <SelectItem value={schedule.title} key={index}>
                              {schedule.title}
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

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="keypoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Key points</FormLabel>
                    <FormControl>
                      <Textarea className="h-48 resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        <div className="flex justify-between">
          <Button type="submit" variant={"default"}>
            Add takeaway
          </Button>
          <Button className="flex gap-x-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
