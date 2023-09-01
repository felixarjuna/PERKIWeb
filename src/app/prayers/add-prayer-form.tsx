"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { addPrayerSchema } from "@/server/api/schema/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { trpc } from "../_trpc/client";

const AddPrayerFormSchema = z.object({
  anonymous: z.boolean().default(false).optional(),
  content: z.string().min(2),
});

export function AddPrayerForm() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const addPrayer = trpc.prayers.addPrayer.useMutation({
    onSuccess: () => {
      utils.prayers.invalidate();
      toast({
        title: "Your prayer is submitted! 🙏",
        description: "Feel free to add another prayer!",
      });
    },
  });

  const form = useForm<z.infer<typeof AddPrayerFormSchema>>({
    resolver: zodResolver(AddPrayerFormSchema),
    defaultValues: {
      anonymous: false,
    },
  });

  function onSubmit(data: z.infer<typeof AddPrayerFormSchema>) {
    const request: z.infer<typeof addPrayerSchema> = {
      content: data.content,
      name: data.anonymous ? "anonymous" : "username",
      prayerNames: new Array(),
    };
    addPrayer.mutate(request);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="anonymous"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-base">Anonymous</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex gap-x-4 xs:gap-2">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Insert your prayer here..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                className="bg-green-default/70 gap-x-1 hover:bg-green-default xs:text-xs xs:px-2 xs:py-1"
              >
                <Plus className="w-5 h-5 xs:w-4 xs:h-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
