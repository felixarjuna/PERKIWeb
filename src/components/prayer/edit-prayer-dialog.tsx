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
import type { RouterOutputs } from "~/trpc/react";
import EditPrayerForm from "./edit-prayer-form";

type Prayer = RouterOutputs["prayers"]["getPrayers"][number];

export default function EditPrayerDialog({ prayer }: { prayer: Prayer }) {
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
            Change the wording or whether the name is shown. Publication status
            stays as it is.
          </DialogDescription>
        </DialogHeader>
        <EditPrayerForm onCloseDialog={() => setOpen(false)} prayer={prayer} />
      </DialogContent>
    </Dialog>
  );
}
