"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { z } from "zod";
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
import { useAsPath } from "~/utils/hooks/usePathStore";

const SignInFormSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(2),
});

export default function SignInForm() {
  const { data: session } = useSession();

  const router = useRouter();
  if (session) router.back();

  /** signin form. */
  const form = useForm<z.infer<typeof SignInFormSchema>>({
    resolver: zodResolver(SignInFormSchema),
  });

  /** redirect to the previous visited path. */
  const prevRoute = useAsPath();
  const { toast } = useToast();

  /** login action. */
  async function onLogin(value: z.infer<typeof SignInFormSchema>) {
    const response = await signIn("credentials", {
      ...value,
      callbackUrl: prevRoute.prevAsPath,
      redirect: false,
    });

    if (response?.ok)
      toast({
        title: "Authentication successful! 🚀",
        description: "You are now logged in! ❤️",
      });
    if (response?.error)
      toast({
        title: "Authentication failed! 👿",
        description: response.error,
      });
  }

  /** google oauth login action. */
  async function onGoogleLogin() {
    try {
      await signIn("google", {
        callbackUrl: prevRoute.prevAsPath,
      });
      toast({
        title: "Authentication succesfull!",
        description: "You are now logged in! ❤️",
      });
    } catch (error) {
      toast({
        title: "Authentication failed!",
      });
    }
  }

  return (
    <div>
      <div className="mb-4 mt-8">
        <Form {...form}>
          <form
            onSubmit={(event) => void form.handleSubmit(onLogin)(event)}
            className="mt-4 w-full space-y-8"
          >
            <div className="space-y-4">
              <div className="flex-1">
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
              <div className="flex-1">
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
              Sign In
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex items-center justify-center space-x-3">
        <hr className="h-px flex-1 border-none bg-cream-default/70" />
        <p>or continue with</p>
        <hr className="h-px flex-1 border-none bg-cream-default/70" />
      </div>

      <div className="mt-6">
        <button
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={async () => await onGoogleLogin()}
          className="flex w-full items-center justify-center gap-x-2 rounded-lg bg-green-default/60 p-2"
        >
          <FcGoogle />
          Sign In with Google
        </button>
      </div>

      <div className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href={"signup"} className="underline underline-offset-1">
          Sign up
        </Link>
      </div>
    </div>
  );
}
