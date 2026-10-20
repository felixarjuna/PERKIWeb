import React from "react";
import { EditButton } from "~/components/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { RouterOutputs } from "~/trpc/react";
import EditPrayerForm from "./edit-prayer-form";

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerDialog({ prayer }: { prayer: Prayer }) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const onCloseDialog = () => {
    setIsOpen(false);
  };

  return (
    <Dialog onOpenChange={(open) => setIsOpen(open)} open={isOpen}>
      <DialogTrigger asChild>
        <EditButton />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit prayer</DialogTitle>
          <DialogDescription>
            Update your prayer request or change its visibility.
          </DialogDescription>
        </DialogHeader>
        <EditPrayerForm onCloseDialog={() => onCloseDialog()} prayer={prayer} />
      </DialogContent>
    </Dialog>
  );
}
