"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import { useForm } from "react-hook-form";
import { type z } from "zod";
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
import { insertUserParams } from "~/lib/db/schema/auth";
import { api } from "~/utils/api";

export default function SignUpForm() {
  const { data: session } = useSession();

  const router = useRouter();
  if (session) router.back();

  const { toast } = useToast();
  const signUpUser = api.users.createUser.useMutation({
    onSuccess: async () => {
      toast({
        title: "User account created successfully! 🚀",
        description: "Please login!",
      });

      // Redirect to login page after registration
      await router.push("/auth/signin");
    },
    onError: ({ message }) => {
      toast({
        title: "Create user account failed! 👿",
        description: message,
      });
    },
  });

  // Define sign in form
  const form = useForm<z.infer<typeof insertUserParams>>({
    resolver: zodResolver(insertUserParams),
    defaultValues: {
      emailVerified: null,
      image: null,
    },
  });

  // Define on submit callback function
  function onSubmit(value: z.infer<typeof insertUserParams>) {
    signUpUser.mutate(value);
  }

  return (
    <div>
      <div className="mb-4 mt-8">
        <Form {...form}>
          <form
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
            className="mt-4 w-full space-y-8"
          >
            <div className="space-y-4 ">
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
                      <FormLabel>Username</FormLabel>
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
            </div>

            <Button variant={"secondary"} type="submit" className="w-full">
              Create Account
            </Button>
          </form>
        </Form>
      </div>

      <div className="mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href={"signin"} className="underline underline-offset-1">
          Sign in
        </Link>
      </div>
    </div>
  );
}
