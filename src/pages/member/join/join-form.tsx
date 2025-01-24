"use client";

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
import { Input } from "~/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import Loader from "~/components/loader";
import { PhoneInput } from "~/components/ui/phone-input";
import { useToast } from "~/components/ui/use-toast";
import { addProfileSchema } from "~/server/api/schema/schema";
import { api } from "~/utils/api";

export default function JoinForm() {
  const router = useRouter();
  const { data: session } = useSession();
  if (session === null) router.push("/auth/signin");

  /** define form. */
  const form = useForm<z.infer<typeof addProfileSchema>>({
    resolver: zodResolver(addProfileSchema),
    defaultValues: {},
  });

  /** load form data. */
  React.useEffect(() => {
    form.reset({
      userId: session?.user.id,
    });
  }, [form, session?.user.id]);

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

      setTimeout(() => {
        router.push("/");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit the form 😢",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof addProfileSchema>) {
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
            <FormItem className="flex flex-col space-y-1.5">
              <FormLabel>Date of birth</FormLabel>

              <FormControl className="w-full">
                <div className="relative w-full">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-green-500" />
                  <Input
                    id="dob"
                    type="date"
                    value={field.value?.toString()}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-[190px] pl-8"
                  />
                </div>
              </FormControl>

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
                <Input
                  placeholder="Roermonderstr. 110"
                  type="text"
                  {...field}
                />
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
          name="phoneNumber"
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
        <Button type="submit" disabled={addProfile.isLoading}>
          {addProfile.isLoading ? (
            <Loader message="Adding profile ..." className="text-xs" />
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
}
