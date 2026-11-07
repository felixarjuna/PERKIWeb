"use client";

import { Plus } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  MAX_AUTHOR,
  MAX_DESCRIPTION,
  MAX_LANGUAGE,
  MAX_TITLE,
  OFFERED_HINT,
} from "~/lib/library";
import { api } from "~/trpc/react";

const EMPTY = { author: "", description: "", language: "", title: "" };

/**
 * "Offer a book": a member lends a book of their own to the library. It's
 * listed as Offered until the librarian has it in hand and accepts it.
 */
export function OfferBook() {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(EMPTY);
  const set =
    (key: keyof typeof EMPTY) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((current) => ({ ...current, [key]: event.target.value }));
  const utils = api.useUtils();
  const offer = api.library.offer.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success(`Thanks! ${OFFERED_HINT}`);
      setOpen(false);
      setDraft(EMPTY);
      await utils.library.invalidate();
    },
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        <Plus aria-hidden="true" />
        Offer a book
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Offer a book</DialogTitle>
            <DialogDescription>
              Lend a book of yours to the library. It stays yours, and you'll
              see who has it under My books. {OFFERED_HINT}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            id="offer-form"
            onSubmit={(event) => {
              event.preventDefault();
              offer.mutate(draft);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="offer-title">Title</Label>
              <Input
                id="offer-title"
                maxLength={MAX_TITLE}
                onChange={set("title")}
                required
                value={draft.title}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-author">Author</Label>
              <Input
                id="offer-author"
                maxLength={MAX_AUTHOR}
                onChange={set("author")}
                required
                value={draft.author}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-language">Language</Label>
              <Input
                aria-describedby="offer-language-hint"
                id="offer-language"
                maxLength={MAX_LANGUAGE}
                onChange={set("language")}
                value={draft.language}
              />
              <p
                className="type-caption text-muted-foreground"
                id="offer-language-hint"
              >
                Optional, e.g. Indonesian.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-description">Description</Label>
              <Textarea
                aria-describedby="offer-description-hint"
                className="min-h-24"
                id="offer-description"
                maxLength={MAX_DESCRIPTION}
                onChange={set("description")}
                value={draft.description}
              />
              <p
                className="type-caption text-muted-foreground"
                id="offer-description-hint"
              >
                Optional. A sentence or two about what it's about.
              </p>
            </div>
          </form>
          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={offer.isPending} form="offer-form" type="submit">
              {offer.isPending ? "Offering…" : "Offer book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
