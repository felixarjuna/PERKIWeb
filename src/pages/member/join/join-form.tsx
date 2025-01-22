"use client";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { PhoneInput } from "~/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useToast } from "~/components/ui/use-toast";
import { cn } from "~/lib/utils";
import { addProfileSchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

export default function JoinForm() {
  const router = useRouter();
  const { data: session } = useSession();
  if (session === null) {
    router.push("/auth/signin");
  }

  /** define form. */
  const form = useForm<z.infer<typeof addProfileSchema>>({
    resolver: zodResolver(addProfileSchema),
    defaultValues: {
      birthday: new Date("2000-01-01"),
    },
  });

  /** load form data. */
  React.useEffect(() => {
    form.reset({
      userId: session?.user.id,
    });
  }, [form, session?.user.id]);

  console.log("errors", form.formState.errors);

  /** toast. */
  const { toast } = useToast();

  /** handle form submission. */
  const utils = api.useContext();
  const addProfile = api.profiles.addUserProfile.useMutation({
    onSuccess: async () => {
      await utils.profiles.invalidate();
      toast({
        title: "Form submitted successfully! 🎉",
        description: "Thank you for filling out the form! ❤️",
      });
    },
    onError: (error) => {
      console.error("Form submission error", error);
      toast({
        title: "Failed to submit the form 😢",
        description:
          "An error occured while submitting the form. Please contact the adminstrator.",
      });
    },
  });
  function onSubmit(values: z.infer<typeof addProfileSchema>) {
    console.log(values);
    const userId = session?.user.id;
    if (!userId) {
      toast({
        title: "Session expired",
        description:
          "Your session has expired. Please sign in again to continue.",
      });
      return router.push("/auth/signin");
    }

    values.userId = userId;
    addProfile.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-4 py-10"
      >
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[300px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Your date of birth so we could celebrate it 🎉
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Dunantstr. 6" type="" {...field} />
              </FormControl>
              <FormDescription>
                The address where you currently live
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="waNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col items-start">
              <FormLabel>Whatsapp Number</FormLabel>
              <FormControl className="w-full">
                <PhoneInput
                  placeholder="Placeholder"
                  {...field}
                  defaultCountry="DE"
                />
              </FormControl>
              <FormDescription>
                Enter your valid whatsapp number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Aachen" type="" {...field} />
              </FormControl>
              <FormDescription>
                Name of the city where you currently live
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="major"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Major</FormLabel>
              <FormControl>
                <Input placeholder="Maschinenbau" type="" {...field} />
              </FormControl>
              <FormDescription>
                The major you are currently enrolled in
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="" type="" {...field} />
              </FormControl>
              <FormDescription>
                Tell us about who you are or what you do
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
