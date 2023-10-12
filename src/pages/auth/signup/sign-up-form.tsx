import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

import { useForm } from "react-hook-form";
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

const SignUpFormSchema = z.object({
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
  // TODO: Add regex for email
  email: z.string().nonempty(),
  username: z.string().min(2),
  password: z.string().min(2),
});

export default function SignUpForm() {
  const { data: session } = useSession();

  const router = useRouter();
  if (session) router.back();

  // Define sign in form
  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
  });

  // Define on submit callback function
  function onSubmit(data: z.infer<typeof SignUpFormSchema>) {
    console.log(data);
    // TODO: use sign in hook
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
              <div className="grid grid-cols-2 gap-x-2">
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
                        <Input {...field} />
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
