"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import Loader from "~/components/loader";
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
import { PhoneInput } from "~/components/ui/phone-input";
import { authPageUrl } from "~/lib/auth-redirect";
import { addProfileSchema } from "~/server/api/schema/schema";
import { api } from "~/trpc/react";

/** Length of the `YYYY-MM-DD` prefix of an ISO timestamp. */
const ISO_DATE_LENGTH = 10;

export default function JoinForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        authPageUrl(
          "signin",
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )
      );
    }
  }, [router, status]);

  const form = useForm<z.infer<typeof addProfileSchema>>({
    defaultValues: {
      address: "",
      bio: "",
      location: "",
      major: "",
      phoneNumber: "",
      userId,
    },
    resolver: zodResolver(addProfileSchema),
  });

  /** toast. */

  /** handle form submission. */
  const utils = api.useUtils();
  const addProfile = api.profiles.addUserProfile.useMutation({
    onError: (error) => {
      toast.error("Failed to submit the form", {
        description: error.message,
      });
    },
    onSuccess: async () => {
      await utils.profiles.invalidate();
      toast.success("Form submitted successfully!", {
        description: "Thank you for filling out the form!",
      });

      router.push("/");
      router.refresh();
    },
  });

  function onSubmit(values: z.infer<typeof addProfileSchema>) {
    const currentUserId = session?.user.id;
    if (!currentUserId) {
      toast.error("Session expired", {
        description:
          "Your session has expired. Please sign in again to continue.",
      });
      router.replace(
        authPageUrl(
          "signin",
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )
      );
      return;
    }

    addProfile.mutate({ ...values, userId: currentUserId });
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-1.5">
              <FormLabel>Date of birth</FormLabel>

              <FormControl>
                <Input
                  className="w-full"
                  name={field.name}
                  onBlur={field.onBlur}
                  // The schema expects a Date; valueAsDate is UTC midnight,
                  // matching how the old z.coerce.date() parsed the string.
                  onChange={(e) =>
                    field.onChange(e.target.valueAsDate ?? undefined)
                  }
                  ref={field.ref}
                  type="date"
                  value={
                    field.value
                      ? field.value.toISOString().slice(0, ISO_DATE_LENGTH)
                      : ""
                  }
                />
              </FormControl>

              <FormDescription>
                Your date of birth so we could celebrate it
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
                  placeholder="+49 151 12345678"
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
                <Input placeholder="Aachen" type="text" {...field} />
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
                <Input placeholder="Maschinenbau" type="text" {...field} />
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
                <Input placeholder="" type="text" {...field} />
              </FormControl>
              <FormDescription>
                Tell us about who you are or what you do
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          disabled={addProfile.isPending || status !== "authenticated"}
          type="submit"
        >
          {addProfile.isPending ? (
            <Loader className="type-caption" message="Adding profile ..." />
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
}
