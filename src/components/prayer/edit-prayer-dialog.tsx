"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import EditPrayerForm, { type EditablePrayer } from "./edit-prayer-form";

export default function EditPrayerDialog({
  prayer,
  note = "Publication status stays as it is.",
}: {
  prayer: EditablePrayer;
  /** What happens to the request's visibility after saving. */
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="secondary">
          <Pencil aria-hidden="true" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit prayer request</DialogTitle>
          <DialogDescription>
            Change the wording or whether the name is shown. {note}
          </DialogDescription>
        </DialogHeader>
        <EditPrayerForm onCloseDialog={() => setOpen(false)} prayer={prayer} />
      </DialogContent>
    </Dialog>
  );
}
