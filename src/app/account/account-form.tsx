"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "~/components/ui/label";
import { type UpdateUserParams, updateUserParams } from "~/lib/db/schema/auth";
import { api } from "~/trpc/react";

const PASSWORD_PLACEHOLDER_LENGTH = 8;

export default function AccountForm() {
  const { data: user } = api.users.getUserById.useQuery();

  const updateAccount = api.users.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Update account info successful!", {
        description: "Your account has been updated! ✨",
      });
    },
    onError: ({ message }) => {
      toast.success("Update user account failed! 👿", { description: message });
    },
  });

  // 1. Define form
  const form = useForm<UpdateUserParams>({
    resolver: zodResolver(updateUserParams),
  });

  React.useEffect(() => {
    if (!user) {
      return;
    }
    form.reset({
      id: user.id,
      name: user.name ?? "",
      username: user.email ?? "",
      image: user.image,
    });
  }, [form, user]);

  // 2. Define a submit handler
  function onSubmit(values: UpdateUserParams) {
    updateAccount.mutate(values);
  }

  /** OAuth accounts have no local password and cannot edit credentials here. */
  const isOAuthAccount =
    user !== undefined && user !== null && !user.hasPassword;

  return (
    <Form {...form}>
      {isOAuthAccount ? (
        <div className="mb-8 text-xs sm:text-sm">
          <Button
            className="h-fit min-w-fit px-4 py-4 text-center sm:px-6 sm:py-6 xl:py-8 2xl:py-8"
            variant={"outline"}
          >
            You can not change your email and password if you are logged in with
            Google Account. Please login with another account instead.
          </Button>
        </div>
      ) : null}

      <form
        className="w-full min-w-[10rem] space-y-8 sm:min-w-[32rem]"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <div className="space-y-4">
          <div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username / Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isOAuthAccount} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              disabled
              readOnly
              type="password"
              value={"•".repeat(PASSWORD_PLACEHOLDER_LENGTH)}
            />
          </div>
        </div>

        <Button className="w-full" type="submit" variant={"secondary"}>
          Update account
        </Button>
      </form>
    </Form>
  );
}
