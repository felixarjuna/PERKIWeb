"use client";

import {
  Check,
  MoreHorizontal,
  PencilLine,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { TakeawayStatus } from "~/lib/db/schema/schema";
import { type StatusRights, statusActions } from "~/lib/takeaway-status";
import { api } from "~/trpc/react";

const confirmations: Record<TakeawayStatus, string> = {
  draft: "Takeaway sent back to draft.",
  in_review: "Takeaway sent to review.",
  published: "Takeaway published. It is now on the website.",
};

/** One next step, with editing and less frequent actions in a named menu. */
export function TakeawayActions({
  id,
  name,
  rights,
  status,
}: {
  readonly id: number;
  readonly name: string;
  readonly rights: StatusRights;
  readonly status: TakeawayStatus;
}) {
  const utils = api.useUtils();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const change = api.takeaways.setStatus.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (row) => {
      await utils.takeaways.getManageable.cancel();
      await utils.takeaways.invalidate();
      toast.success(confirmations[row.status]);
    },
  });
  const remove = api.takeaways.deleteTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      setConfirmDelete(false);
      await utils.takeaways.getManageable.cancel();
      await utils.takeaways.invalidate();
      toast.success("Takeaway deleted.");
    },
  });
  const actions = statusActions(status, rights);
  const primary = actions.find((action) => action.primary);
  const secondary = actions.filter((action) => !action.primary);
  const pending = change.isPending || remove.isPending;
  const PrimaryIcon = primary?.to === "published" ? Check : Send;
  if (!(primary || rights.canManage || secondary.length)) {
    return null;
  }
  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 self-start">
      {primary ? (
        <Button
          aria-label={`${primary.label}: ${name}`}
          disabled={pending}
          onClick={() => change.mutate({ id, status: primary.to })}
          type="button"
        >
          <PrimaryIcon aria-hidden="true" data-icon="inline-start">
            <title>{primary.label}</title>
          </PrimaryIcon>
          {primary.label}
        </Button>
      ) : null}
      <AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`More actions for ${name}`}
              disabled={pending}
              ref={trigger}
              size="icon"
              type="button"
              variant="secondary"
            >
              <MoreHorizontal aria-hidden="true">
                <title>More actions</title>
              </MoreHorizontal>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="overscroll-contain">
            {rights.canManage ? (
              <DropdownMenuItem asChild>
                <Link
                  aria-label={`Edit ${name}`}
                  href={`/admin/takeaways/${id}/edit`}
                >
                  <PencilLine aria-hidden="true">
                    <title>Edit</title>
                  </PencilLine>
                  Edit
                </Link>
              </DropdownMenuItem>
            ) : null}
            {secondary.map((action) => (
              <DropdownMenuItem
                key={action.to}
                onSelect={() => change.mutate({ id, status: action.to })}
              >
                <Undo2 aria-hidden="true">
                  <title>{action.label}</title>
                </Undo2>
                {action.label}
              </DropdownMenuItem>
            ))}
            {rights.canManage ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  aria-label={`Delete ${name}`}
                  className="text-destructive-text focus:text-destructive-text"
                  onSelect={() => setConfirmDelete(true)}
                >
                  <Trash2 aria-hidden="true">
                    <title>Delete</title>
                  </Trash2>
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this takeaway. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Keep takeaway
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                remove.mutate({ id });
              }}
            >
              <Trash2 aria-hidden="true" data-icon="inline-start">
                <title>Delete takeaway</title>
              </Trash2>
              {remove.isPending ? "Deleting…" : "Delete takeaway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
