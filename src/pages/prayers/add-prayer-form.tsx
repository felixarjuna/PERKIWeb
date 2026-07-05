"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import type { addPrayerSchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";
import { toast } from "sonner";

const AddPrayerFormSchema = z.object({
  isAnonymous: z.boolean(),
  content: z.string().min(2),
});

export default function AddPrayerForm() {
  const { data: session } = useSession();

  const utils = api.useUtils();
  const addPrayer = api.prayers.addPrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Your prayer is submitted! 🙏", { description: "Feel free to add another prayer!" });
    },
  });

  const form = useForm<z.infer<typeof AddPrayerFormSchema>>({
    resolver: zodResolver(AddPrayerFormSchema),
    defaultValues: {
      isAnonymous: false,
    },
  });

  function onSubmit(data: z.infer<typeof AddPrayerFormSchema>) {
    const request: z.infer<typeof addPrayerSchema> = {
      content: data.content,
      name: getUsernameFromName(session?.user.name ?? ""),
      isAnonymous: data.isAnonymous,
      prayerNames: [],
    };
    addPrayer.mutate(request);
  }

  return (
    <Form {...form}>
      <form
        className="w-full space-y-6"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <div className="grid gap-y-4">
          <div className="flex xs:gap-2 gap-x-4">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Insert prayer ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              className="gap-x-1 bg-green-default/70 xs:px-2 xs:py-1 xs:text-xs hover:bg-green-default"
              type="submit"
            >
              <Plus className="h-5 xs:h-4 w-5 xs:w-4" />
              Add
            </Button>
          </div>

          <div className="flex flex-col space-y-4">
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="self flex items-center space-x-2 space-y-0">
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
          </div>
        </div>
      </form>
    </Form>
  );
}
