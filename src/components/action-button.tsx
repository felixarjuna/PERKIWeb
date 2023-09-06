import { PenBoxIcon, TrashIcon } from "lucide-react";

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
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md bg-green-default/80 hover:bg-dark-green-default"
        onClick={() => onEditClick()}
      >
        <PenBoxIcon className="h-4 w-4 xs:h-3 xs:w-3" />
      </div>
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md bg-red-300/30 hover:bg-red-300/50"
        onClick={() => onDeleteClick()}
      >
        <TrashIcon className="h-4 w-4 xs:h-3 xs:w-3" />
      </div>
    </div>
  );
}
