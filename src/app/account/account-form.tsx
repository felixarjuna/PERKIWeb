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
      name: user.name ?? "",
    });
  }, [form, user]);

  // 2. Define a submit handler
  function onSubmit(values: UpdateUserParams) {
    updateAccount.mutate(values);
  }

  return (
    <Form {...form}>
      <div className="type-body-sm flex items-start gap-3 rounded-lg bg-card p-4 text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          You sign in with Google. Your email is managed by your Google account.
        </p>
      </div>

      <form
        className="flex w-full flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
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
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              autoComplete="email"
              id="account-email"
              readOnly
              type="email"
              value={user?.email ?? ""}
            />
          </div>
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
