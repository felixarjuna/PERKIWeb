import React from "react";
import { EditButton } from "~/components/action-button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { type RouterOutputs } from "~/utils/api";
import EditPrayerForm from "./edit-prayer-form";

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerDialog({ prayer }: { prayer: Prayer }) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const onCloseDialog = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => setIsOpen(isOpen)}>
      <DialogTrigger>
        <EditButton
          onEditClick={() => {
            console.log("Prayer edited.");
          }}
        />
      </DialogTrigger>
      <DialogContent>
        <EditPrayerForm prayer={prayer} onCloseDialog={() => onCloseDialog()} />
      </DialogContent>
    </Dialog>
  );
}
