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

const DEFAULT_DELETE_DESCRIPTION =
  "This will permanently delete your entry and cannot be undone.";

interface ActionButtonProps {
  className?: string;
  /** What the delete confirmation says will be lost. */
  deleteDescription?: string;
  onDeleteClick: () => void;
  onEditClick?: () => void;
}

export default function ActionButton({
  onEditClick,
  onDeleteClick,
  className,
  deleteDescription,
}: ActionButtonProps) {
  return (
    <div className={className}>
      <EditButton onEditClick={onEditClick} />
      <DeleteButton
        description={deleteDescription}
        onDeleteClick={onDeleteClick}
      />
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

export function DeleteButton({
  onDeleteClick,
  description = DEFAULT_DELETE_DESCRIPTION,
}: {
  onDeleteClick: () => void;
  description?: string;
}) {
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
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
