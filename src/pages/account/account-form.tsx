"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
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
import { updateUserParams, type UpdateUserParams } from "~/lib/db/schema/auth";
import { api } from "~/utils/api";

const PASSWORD_MAX_LENGTH = 17;

export default function AccountForm() {
  const { data: session } = useSession();
  const { data: user } = api.users.getUserById.useQuery({
    id: session?.user.id ?? "",
  });

  const { toast } = useToast();
  const updateAccount = api.users.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Update account info successful!",
        description: "Your account has been updated! ✨",
      });
    },
    onError: ({ message }) => {
      toast({
        title: "Update user account failed! 👿",
        description: message,
      });
    },
  });

  // 1. Define form
  const form = useForm<UpdateUserParams>({
    resolver: zodResolver(updateUserParams),
    defaultValues: {
      ...user,
      hashedPassword: user?.hashedPassword ?? "",
    },
  });

  React.useEffect(() => {
    form.reset({
      ...user,
      hashedPassword: user?.hashedPassword,
      username: user?.email,
    });
  }, [form, user]);

  // 2. Define a submit handler
  function onSubmit(values: UpdateUserParams) {
    updateAccount.mutate(values);
  }

  const isGoogleAccount = React.useMemo(() => {
    return (
      session?.user.email?.endsWith("@gmail.com") &&
      user?.hashedPassword === null
    );
  }, [session?.user.email, user?.hashedPassword]);

  return (
    <Form {...form}>
      {isGoogleAccount ? (
        <div className="max-w-sm text-xs sm:max-w-lg sm:text-sm">
          <Button
            variant={"outline"}
            className="h-fit min-w-fit px-4 py-4 text-center sm:px-6 sm:py-6 xl:py-8 2xl:py-8"
          >
            You can not change your email and password if you are logged in with
            Google Account. Please login with another account instead.
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="w-full min-w-[10rem] space-y-8 sm:min-w-[32rem]"
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
                    <Input {...field} disabled={isGoogleAccount} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="hashedPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value?.substring(0, PASSWORD_MAX_LENGTH)}
                      type="password"
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button variant={"secondary"} type="submit" className="w-full">
          Update account
        </Button>
      </form>
    </Form>
  );
}
