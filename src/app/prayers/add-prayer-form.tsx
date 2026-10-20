"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import type { addPrayerSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";

const AddPrayerFormSchema = z.object({
  content: z.string().min(2),
  isAnonymous: z.boolean(),
});

export default function AddPrayerForm() {
  const utils = api.useUtils();
  const addPrayer = api.prayers.addPrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast.success("Your prayer is submitted!", {
        description: "Feel free to add another prayer!",
      });
    },
  });

  const form = useForm<z.infer<typeof AddPrayerFormSchema>>({
    defaultValues: {
      isAnonymous: false,
    },
    resolver: zodResolver(AddPrayerFormSchema),
  });

  function onSubmit(data: z.infer<typeof AddPrayerFormSchema>) {
    const request: z.infer<typeof addPrayerSchema> = {
      content: data.content,
      isAnonymous: data.isAnonymous,
    };
    addPrayer.mutate(request);
  }

  return (
    <Form {...form}>
      <form className="w-full space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-y-4">
          <div className="flex gap-x-4">
            <div className="min-w-0 flex-1">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prayer request</FormLabel>
                    <FormControl>
                      <Input placeholder="Insert prayer ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button className="mt-7 gap-x-1" type="submit">
              <Plus className="h-5 w-5" />
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
                  <FormLabel className="type-body-sm">Anonymous</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
}
