"use client";

import { LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

const CONFIRM_WORD = "delete";

function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const deleteMine = api.users.deleteMine.useMutation({
    onError: () => {
      toast.error("Your account couldn't be deleted. Please try again.");
    },
    onSuccess: async () => {
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
      toast.success("Your account has been deleted.");
    },
  });
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <AlertDialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setTyped("");
        }
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button
          className="gap-2 text-destructive-text hover:text-destructive-text"
          type="button"
          variant="ghost"
        >
          <Trash2 className="size-4" />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (confirmed) {
              deleteMine.mutate();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your account, your profile details and the prayer
              requests you wrote. It can't be undone. Takeaways you wrote stay,
              without your name, and the schedule keeps the names it lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="delete-account-confirm">
              Type “{CONFIRM_WORD}” to confirm
            </Label>
            <Input
              autoCapitalize="none"
              autoComplete="off"
              id="delete-account-confirm"
              onChange={(event) => setTyped(event.target.value)}
              value={typed}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMine.isPending}>
              Keep my account
            </AlertDialogCancel>
            <Button
              disabled={!confirmed || deleteMine.isPending}
              type="submit"
              variant="destructive"
            >
              {deleteMine.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AccountActions({
  canDelete,
}: {
  /** False for the owner: there must always be exactly one. */
  canDelete: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
      {canDelete ? <DeleteAccount /> : <span />}
      <Button
        className="gap-2"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        type="button"
        variant="ghost"
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}
