"use client";

import { UserPlus, UsersRound } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { nameKey } from "~/lib/people";
import { api } from "~/trpc/react";
import { type Account, accountName, MemberPicker } from "../member-picker";

const MAX_NAME = 100;

interface TermGroup {
  id: number;
  members: { name: string }[];
  name: string;
}

/**
 * Adds a registered member to a group, or a guest without an account by name.
 * Members already in a group this term are shown but can't be picked.
 */
export function AddMemberDialog({
  group,
  groups,
  open,
  onOpenChange,
}: {
  group: { id: number; name: string };
  /** Every group of the term, to show who is already placed. */
  groups: TermGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const accounts = api.people.accounts.useQuery(undefined, { enabled: open });
  const utils = api.useUtils();
  const add = api.groups.addMember.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const [guest, setGuest] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [name, setName] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setGuest(false);
      setUserId("");
      setName("");
    }
  }, [open]);

  const placed = new Map(
    groups.flatMap((candidate) =>
      candidate.members.map((member) => [nameKey(member.name), candidate.name])
    )
  );
  const unavailable = (account: Account) => {
    const where = account.name ? placed.get(nameKey(account.name)) : undefined;
    return where ? `In ${where}` : null;
  };
  const picked = accounts.data?.find((account) => account.id === userId);
  const ready = guest ? name.trim() !== "" : Boolean(picked);
  const pickedName = picked ? accountName(picked) : "";
  const added = guest ? name.trim() : pickedName;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {group.name}</DialogTitle>
          <DialogDescription>
            {guest
              ? "For someone without an account. They're linked once a name link matches."
              : "Pick a member from the site."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready) {
              return;
            }
            add.mutate(
              guest
                ? { groupId: group.id, name }
                : { groupId: group.id, userId },
              {
                onSuccess: async () => {
                  await utils.groups.invalidate();
                  toast.success(`${added} added to ${group.name}`);
                  onOpenChange(false);
                },
              }
            );
          }}
        >
          {guest ? (
            <div className="grid gap-2">
              <Label htmlFor={`guest-${group.id}`}>Name</Label>
              <Input
                autoComplete="off"
                id={`guest-${group.id}`}
                maxLength={MAX_NAME}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="type-body-sm font-medium">
                {picked ? `Member: ${accountName(picked)}` : "Member"}
              </p>
              <MemberPicker
                accounts={accounts.data}
                onChange={setUserId}
                pending={accounts.isPending}
                unavailable={unavailable}
                value={userId}
              />
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={() => setGuest(!guest)}
              type="button"
              variant="ghost"
            >
              {guest ? (
                <UsersRound aria-hidden="true" className="size-4" />
              ) : (
                <UserPlus aria-hidden="true" className="size-4" />
              )}
              {guest ? "Pick a member" : "Not on the site yet"}
            </Button>
            <Button disabled={!ready || add.isPending} type="submit">
              {add.isPending ? "Adding…" : `Add to ${group.name}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
