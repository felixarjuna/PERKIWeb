"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { insertUserParams } from "~/lib/db/schema/auth";
import { api } from "~/trpc/react";

export default function SignUpForm() {
  const router = useRouter();

  const signUpUser = api.users.createUser.useMutation({
    onError: ({ message }) => {
      toast.error("Create user account failed!", { description: message });
    },
    onSuccess: () => {
      toast.success("User account created successfully!", {
        description: "Please login!",
      });

      // Redirect to login page after registration
      router.push("/auth/signin");
    },
  });

  // Define sign up form
  const form = useForm<z.infer<typeof insertUserParams>>({
    defaultValues: {
      name: "",
      password: "",
      username: "",
    },
    resolver: zodResolver(insertUserParams),
  });

  // Define on submit callback function
  function onSubmit(value: z.infer<typeof insertUserParams>) {
    signUpUser.mutate(value);
  }

  return (
    <div className="mt-8">
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
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
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="new-password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="mt-2 w-full"
            disabled={signUpUser.isPending}
            type="submit"
          >
            {signUpUser.isPending ? "Creating account ..." : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
