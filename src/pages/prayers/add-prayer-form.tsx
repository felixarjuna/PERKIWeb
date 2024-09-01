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
import { useToast } from "~/components/ui/use-toast";
import { getUsernameFromName } from "~/lib/utils";
import { type addPrayerSchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

const AddPrayerFormSchema = z.object({
  isAnonymous: z.boolean().default(false),
  content: z.string().min(2),
});

export default function AddPrayerForm() {
  const { data: session } = useSession();

  const { toast } = useToast();
  const utils = api.useContext();
  const addPrayer = api.prayers.addPrayer.useMutation({
    onSuccess: async () => {
      await utils.prayers.invalidate();
      toast({
        title: "Your prayer is submitted! 🙏",
        description: "Feel free to add another prayer!",
      });
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
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full space-y-6"
      >
        <div className="grid gap-y-4">
          <div className="flex gap-x-4 xs:gap-2">
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
              type="submit"
              className="gap-x-1 bg-green-default/70 hover:bg-green-default xs:px-2 xs:py-1 xs:text-xs"
            >
              <Plus className="h-5 w-5 xs:h-4 xs:w-4" />
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
