"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
    onSuccess: () => {
      toast.success("User account created successfully! 🚀", {
        description: "Please login!",
      });

      // Redirect to login page after registration
      router.push("/auth/signin");
    },
    onError: ({ message }) => {
      toast.error("Create user account failed! 👿", { description: message });
    },
  });

  // Define sign up form
  const form = useForm<z.infer<typeof insertUserParams>>({
    resolver: zodResolver(insertUserParams),
    defaultValues: {
      name: "",
      username: "",
      password: "",
    },
  });

  // Define on submit callback function
  function onSubmit(value: z.infer<typeof insertUserParams>) {
    signUpUser.mutate(value);
  }

  return (
    <div>
      <div className="mt-8 mb-4">
        <Form {...form}>
          <form
            className="mt-4 w-full space-y-8"
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          >
            <div className="space-y-4">
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
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              className="w-full"
              disabled={signUpUser.isPending}
              type="submit"
              variant={"secondary"}
            >
              Create Account
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link className="underline underline-offset-1" href={"/auth/signin"}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
