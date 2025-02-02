import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useAuth from "~/hooks/useAuth";
import { cn } from "~/lib/utils";
import { useToast } from "./ui/use-toast";

const username = "mita";
const password = "gongxifacai2025";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { setAuthorized } = useAuth();

  const router = useRouter();
  const { toast } = useToast();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.username === username && form.password === password) {
      setAuthorized(true);
      toast({
        title: "Login successful! ❤️",
        description: "Welcome back, MitA!",
      });
      router.push("/admin/dashboard");
    } else {
      setAuthorized(false);
      toast({
        title: "Login failed!",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  /** local state for username and password. */
  const [form, setForm] = React.useState<{
    username: string;
    password: string;
  }>({ username: "", password: "" });

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
                  id="email"
                  type="text"
                  required
                  className="text-cream-default"
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="text-cream-default"
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full bg-green-default">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
