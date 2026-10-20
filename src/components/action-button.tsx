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
import { Button, type ButtonProps } from "./ui/button";

interface ActionButtonProps {
  className?: string;
  onDeleteClick: () => void;
  onEditClick?: () => void;
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

export function EditButton({
  onEditClick,
  ...props
}: ButtonProps & { onEditClick?: () => void }) {
  return (
    <Button
      aria-label="Edit"
      onClick={onEditClick}
      size="icon-sm"
      type="button"
      variant="secondary"
      {...props}
    >
      <PenBoxIcon aria-hidden="true" />
    </Button>
  );
}

export function DeleteButton({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label="Delete"
          size="icon-sm"
          type="button"
          variant="destructive"
        >
          <TrashIcon aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-10/12">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your entry and cannot be undone.
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
