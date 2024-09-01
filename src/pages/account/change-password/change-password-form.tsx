"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

import React from "react";
import { useForm } from "react-hook-form";
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
import { useToast } from "~/components/ui/use-toast";
import {
  updatePasswordParams,
  type UpdatePasswordParams,
} from "~/lib/db/schema/auth";
import { api } from "~/utils/api";

export default function ChangePasswordForm() {
  // Load user from database
  const { data: session } = useSession();
  const { data: user } = api.users.getUserById.useQuery({
    id: session?.user.id ?? "",
  });

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
  const { toast } = useToast();
  const updatePassword = api.users.updatePassword.useMutation({
    onSuccess: async () => {
      toast({
        title: "Update password successful!",
        description: "Your password has been updated! ✨",
      });
      // Redirect to login page after registration
      await router.push("/account");
    },
    onError: ({ message }) => {
      toast({
        title: "Update password failed! 👿",
        description: message,
      });
    },
  });

  // 2. Define a submit handler
  function onSubmit(values: UpdatePasswordParams) {
    updatePassword.mutate(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full sm:min-w-[32rem] space-y-8 min-w-[10rem]"
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

        <Button variant={"secondary"} type="submit" className="w-full">
          Save password
        </Button>
      </form>
    </Form>
  );
}
