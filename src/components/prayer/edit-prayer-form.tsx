"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Switch } from "~/components/ui/switch";
import { getUsernameFromName } from "~/lib/utils";
import type { editPrayerSchema } from "~/server/api/schema/schema";
import { api, type RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";

const EditPrayerFormSchema = z.object({
  isAnonymous: z.boolean(),
  content: z.string().min(2),
});

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerForm({
  prayer,
  onCloseDialog,
}: {
  prayer: Prayer;
  onCloseDialog: () => void;
}) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const updatePrayer = api.prayers.updatePrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Your prayer is updated successfully! ✨", { description: "God bless you! ❤️" });
    },
  });

  const form = useForm<z.infer<typeof EditPrayerFormSchema>>({
    resolver: zodResolver(EditPrayerFormSchema),
    defaultValues: {
      isAnonymous: prayer.isAnonymous ?? undefined,
      content: prayer.content,
    },
  });

  function onSubmit(data: z.infer<typeof EditPrayerFormSchema>) {
    const request: z.infer<typeof editPrayerSchema> = {
      ...prayer,
      name: prayer.name ?? getUsernameFromName(session?.user.name ?? ""),
      content: data.content,
      isAnonymous: data.isAnonymous,
      prayerNames: prayer.prayerNames as string[],
    };
    updatePrayer.mutate(request);
    onCloseDialog();
  }

  return (
    <Form {...form}>
      <form
        className="w-full space-y-6"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm">Anonymous</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex xs:flex-col xs:gap-2 gap-x-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Insert your prayer here..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex xs:justify-end">
                <Button className="w-fit" type="submit">
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
