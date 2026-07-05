import { PenBoxIcon, TrashIcon } from "lucide-react";
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
} from "./ui/alert-dialog";

interface ActionButtonProps {
  onEditClick?: () => void;
  onDeleteClick: () => void;
  className?: string;
}

export default function ActionButton({
  onEditClick,
  onDeleteClick,
  className,
}: ActionButtonProps) {
  return (
    <div className={className}>
      <EditButton onEditClick={onEditClick} />
      <DeleteButton onDeleteClick={onDeleteClick} />
    </div>
  );
}

export function EditButton({ onEditClick }: { onEditClick?: () => void }) {
  return (
    <button
      aria-label="Edit"
      className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/80 hover:bg-accent"
      onClick={onEditClick}
      type="button"
    >
      <PenBoxIcon className="h-4 w-4" />
    </button>
  );
}

export function DeleteButton({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          aria-label="Delete"
          className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/50 hover:bg-destructive/70"
          type="button"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-10/12">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your entry and cannot be undone. 😥
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
            onClick={onDeleteClick}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
