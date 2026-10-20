"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { getReturnPath } from "~/lib/auth-redirect";

const signInSchema = z.object({
  password: z.string().min(1, { message: "Please enter your password." }),
  username: z
    .string()
    .trim()
    .min(1, { message: "Please enter your username." }),
});

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    className="size-4"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Google</title>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function SignInForm({ returnPath }: { returnPath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getReturnPath(
    returnPath ?? searchParams.get("callbackUrl")
  );
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    defaultValues: { password: "", username: "" },
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    setIsSigningIn(true);
    try {
      const result = await signIn("credentials", {
        password: values.password,
        redirect: false,
        redirectTo: callbackUrl,
        username: values.username,
      });
      if (!result?.ok || result.error) {
        toast.error("Sign in failed", {
          description: "Username or password is wrong.",
        });
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Sign in failed", {
        description: "Unable to connect. Please try again.",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const onGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signIn("google", { redirectTo: callbackUrl });
    } catch {
      toast.error("Sign in with Google failed.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      {searchParams.get("error") ? (
        <p className="text-destructive text-sm" role="alert">
          Sign in could not be completed. Please try again or use your original
          sign-in method.
        </p>
      ) : null}
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
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
                    autoComplete="current-password"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="mt-2 w-full" disabled={isSigningIn} type="submit">
            {isSigningIn ? "Signing in ..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="type-caption flex items-center gap-3 text-muted-foreground">
        <span className="h-px flex-1 bg-muted" />
        or
        <span className="h-px flex-1 bg-muted" />
      </div>

      <Button
        className="w-full"
        disabled={isSigningIn}
        onClick={onGoogleLogin}
        type="button"
        variant="secondary"
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </div>
  );
}
