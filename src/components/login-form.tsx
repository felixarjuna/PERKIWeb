"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useAuth from "~/hooks/use-auth";
import { cn } from "~/lib/utils";

const username = "mita";
const password = "gongxifacai2025";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { setAuthorized } = useAuth();

  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.username === username && form.password === password) {
      setAuthorized(true);
      toast.success("Login successful!", {
        description: "Welcome back, MitA!",
      });
      router.push("/admin/dashboard");
    } else {
      setAuthorized(false);
      toast.error("Login failed!", {
        description: "Invalid username or password.",
      });
    }
  };

  /** local state for username and password. */
  const [form, setForm] = React.useState<{
    username: string;
    password: string;
  }>({ password: "", username: "" });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Username</Label>
                <Input
                  className="text-foreground"
                  id="email"
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  required
                  type="text"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  className="text-foreground"
                  id="password"
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  required
                  type="password"
                />
              </div>
              <Button className="w-full bg-accent" type="submit">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
