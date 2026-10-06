"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
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
    onError: ({ message }) => {
      toast.error("Update account failed", { description: message });
    },
    onSuccess: () => {
      toast.success("Account updated!");
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
      image: user.image,
      name: user.name ?? "",
      username: user.email ?? "",
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
        <div className="flex items-start gap-3 rounded-lg bg-card p-4 text-muted-foreground text-sm">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            You signed in with Google, so your email and password are managed by
            your Google account.
          </p>
        </div>
      ) : null}

      <form
        className="flex w-full flex-col gap-6"
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

          {user?.hasPassword ? (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                disabled
                readOnly
                type="password"
                value={"•".repeat(PASSWORD_PLACEHOLDER_LENGTH)}
              />
            </div>
          ) : null}
        </div>

        <Button
          className="w-full"
          disabled={updateAccount.isPending || !user}
          type="submit"
        >
          {updateAccount.isPending ? "Updating ..." : "Update account"}
        </Button>
      </form>
    </Form>
  );
}
