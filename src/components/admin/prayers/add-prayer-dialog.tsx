"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import AddPrayerForm from "~/app/prayers/add-prayer-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

/** Page-header action on /admin/prayers. */
export default function AddPrayerDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          Add request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a prayer request</DialogTitle>
          <DialogDescription>
            It stays private until you publish it. Published requests can be
            read by everyone.
          </DialogDescription>
        </DialogHeader>
        <AddPrayerForm
          onAdded={() => setOpen(false)}
          secondaryAction={
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
