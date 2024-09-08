"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { getUsernameFromName } from "~/lib/utils";
import { updateTakeawaySchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

export default function EditTakeawayForm() {
  const { data: session } = useSession();
  const username = React.useMemo(
    () => getUsernameFromName(session?.user.name ?? ""),
    [session?.user.name],
  );

  const { toast } = useToast();
  const router = useRouter();

  const id = router.query.id as string;
  const { data } = api.takeaways.getTakeawayById.useQuery({ id: parseInt(id) });
  const takeaway = React.useMemo(() => {
    return data?.at(0);
  }, [data]);

  const updateTakeaway = api.takeaways.updateTakeaway.useMutation({
    onSuccess: async () => {
      toast({
        title: "Your changes has been saved successfully! ✨",
        description: "Thanks for your contribution!",
      });
      await router.push("/takeaway");
    },
  });

  const contributors = React.useMemo(() => {
    if (takeaway) {
      const _contributors = takeaway.takeaways.contributors as string[];
      const contributors = _contributors.includes(username)
        ? [..._contributors]
        : [..._contributors, username];
      return contributors;
    }
  }, [takeaway, username]);

  // 1. Define form.
  const form = useForm<z.infer<typeof updateTakeawaySchema>>({
    resolver: zodResolver(updateTakeawaySchema),
  });

  React.useEffect(() => {
    form.reset({
      ...takeaway?.takeaways,
      contributors: contributors,
    });
  }, [contributors, form, takeaway]);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof updateTakeawaySchema>) {
    updateTakeaway.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="mt-4 space-y-8 sm:mt-8"
      >
        <div className="space-y-4">
          <h3 className="font-reimbrandt text-2xl sm:text-3xl">
            Fellowship Information
          </h3>
          <section className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <FormItem>
                <FormLabel className="text-md">Schedule</FormLabel>
                <FormControl>
                  <Input value={takeaway?.schedules?.title} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className="col-span-2">
              <FormField
                control={form.control}
                name="keypoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-md">Key points</FormLabel>
                    <FormControl>
                      <Textarea
                        className="h-48 resize-none"
                        {...field}
                        defaultValue={field.value}
                      />
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
            Save changes
          </Button>
          <Button
            type="button"
            className="flex gap-x-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
}
