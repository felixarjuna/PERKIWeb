"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "~/components/ui/use-toast";
import { type editPrayerSchema } from "~/server/api/schema/schema";
import { api, type RouterOutputs } from "~/utils/api";

const EditPrayerFormSchema = z.object({
  isAnonymous: z.boolean().default(false),
  content: z.string().min(2),
});

const username = "felixarjuna";
type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerForm({
  prayer,
  onCloseDialog,
}: {
  prayer: Prayer;
  onCloseDialog: () => void;
}) {
  const { toast } = useToast();
  const utils = api.useContext();
  const updatePrayer = api.prayers.updatePrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast({
        title: "Your prayer is updated successfully! ✨",
        description: "God bless you! ❤️",
      });
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
      name: prayer.name ?? username,
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
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full space-y-6"
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
            <div className="xs:flex-col xs:gap-2 flex gap-x-4">
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

              <div className="xs:justify-end flex">
                <Button type="submit" className="w-fit">
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
