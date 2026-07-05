"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  type UpdatePasswordParams,
  updatePasswordParams,
} from "~/lib/db/schema/auth";
import { api } from "~/trpc/react";

export default function ChangePasswordForm() {
  // Load user from database
  const { data: user } = api.users.getUserById.useQuery();

  // 1. Define form
  const form = useForm<UpdatePasswordParams>({
    resolver: zodResolver(updatePasswordParams),
  });

  React.useEffect(() => {
    form.reset({
      id: user?.id,
    });
  }, [form, user]);

  const router = useRouter();
  const updatePassword = api.users.updatePassword.useMutation({
    onSuccess: async () => {
      toast.success("Update password successful!", {
        description: "Your password has been updated!",
      });
      // Redirect to login page after registration
      router.push("/account");
    },
    onError: ({ message }) => {
      toast.error("Update password failed", { description: message });
    },
  });

  // 2. Define a submit handler
  function onSubmit(values: UpdatePasswordParams) {
    updatePassword.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        className="w-full min-w-[10rem] space-y-8 sm:min-w-[32rem]"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <div className="space-y-4">
          <div>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="retypeNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Re-type new password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button className="w-full" type="submit" variant={"secondary"}>
          Save password
        </Button>
      </form>
    </Form>
  );
}
