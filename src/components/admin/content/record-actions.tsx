"use client";

import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";

export default function RecordActions({
  name,
  editUrl,
  onDelete,
  pending,
  description,
}: {
  name: string;
  editUrl?: string;
  onDelete: () => void;
  pending: boolean;
  description?: string;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {editUrl ? (
        <Link
          aria-label={`Edit ${name}`}
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          href={editUrl}
        >
          Edit
        </Link>
      ) : null}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            aria-label={`Delete ${name}`}
            disabled={pending}
            size="sm"
            type="button"
            variant="ghost"
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {description ??
                "This permanently removes this entry. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
