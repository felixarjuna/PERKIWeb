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

interface ActionButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onEditClick: () => void;
  onDeleteClick: () => void;
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

export function EditButton({ onEditClick }: { onEditClick: () => void }) {
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-md bg-green-default/80 hover:bg-dark-green-default"
      onClick={() => onEditClick()}
    >
      <PenBoxIcon className="h-4 w-4 xs:h-3 xs:w-3" />
    </div>
  );
}

export function DeleteButton({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-300/30 hover:bg-red-300/50">
          <TrashIcon className="h-4 w-4 xs:h-3 xs:w-3" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your entry and cannot be undone. 😥
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-300/50 hover:bg-red-300/30"
            onClick={() => onDeleteClick()}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
