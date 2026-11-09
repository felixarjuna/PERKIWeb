"use client";

import React from "react";
import { toast } from "sonner";
import { LanguagePicker, pickedLanguage } from "~/components/library/language";
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
import { MAX_AUTHOR, MAX_DESCRIPTION, MAX_TITLE } from "~/lib/library";
import { api, type RouterOutputs } from "~/trpc/react";
import { AdminSegmented } from "../admin-controls";
import { MemberPicker } from "../member-picker";

export type ShelfBook = RouterOutputs["library"]["manage"][number];

interface Draft {
  author: string;
  description: string;
  language: string;
  owned: "perki" | "member";
  /** "" while PERKI owns it. */
  ownerId: string;
  title: string;
}

const draftOf = (book?: ShelfBook): Draft => ({
  author: book?.author ?? "",
  description: book?.description ?? "",
  language: book?.language ?? "",
  owned: book?.owner ? "member" : "perki",
  ownerId: book?.owner?.id ?? "",
  title: book?.title ?? "",
});

const ownerOptions = [
  { label: "PERKI", value: "perki" },
  { label: "A member", value: "member" },
];

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p className="type-caption text-muted-foreground" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Adds a book to the shelf, or edits one when `book` is given. */
export function BookDialog({
  open,
  onOpenChange,
  book,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: ShelfBook;
}) {
  const [draft, setDraft] = React.useState(() => draftOf(book));
  React.useEffect(() => {
    if (open) {
      setDraft(draftOf(book));
    }
  }, [open, book]);
  const set =
    <K extends keyof Draft>(key: K) =>
    (value: Draft[K]) =>
      setDraft((current) => ({ ...current, [key]: value }));
  const accounts = api.people.accounts.useQuery(undefined, {
    enabled: open && draft.owned === "member",
  });

  const utils = api.useUtils();
  const onSuccess = async () => {
    await utils.library.invalidate();
    toast.success(book ? "Book saved" : `“${draft.title.trim()}” added`);
    onOpenChange(false);
  };
  const onError = (error: { message: string }) => toast.error(error.message);
  const add = api.library.add.useMutation({ onError, onSuccess });
  const update = api.library.update.useMutation({ onError, onSuccess });
  const pending = add.isPending || update.isPending;
  const needsOwner = draft.owned === "member" && !draft.ownerId;
  // An older free-text language must be picked from the list first.
  const language = pickedLanguage(draft.language);
  const owner = accounts.data?.find((account) => account.id === draft.ownerId);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (language === false) {
      return;
    }
    const input = {
      author: draft.author,
      description: draft.description,
      language,
      ownerId: draft.owned === "member" ? draft.ownerId : null,
      title: draft.title,
    };
    if (book) {
      update.mutate({ ...input, id: book.id });
    } else {
      add.mutate(input);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? "Edit book" : "Add a book"}</DialogTitle>
          <DialogDescription>
            {book
              ? "Members see the title, author, language and description."
              : "It goes straight onto the shelf as available."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" id="book-form" onSubmit={submit}>
          <Field id="book-title" label="Title">
            <Input
              id="book-title"
              maxLength={MAX_TITLE}
              onChange={(event) => set("title")(event.target.value)}
              required
              value={draft.title}
            />
          </Field>
          <Field id="book-author" label="Author">
            <Input
              id="book-author"
              maxLength={MAX_AUTHOR}
              onChange={(event) => set("author")(event.target.value)}
              required
              value={draft.author}
            />
          </Field>
          <LanguagePicker
            id="book-language"
            onChange={set("language")}
            value={draft.language}
          />
          <Field
            hint="Optional. A sentence or two about what it's about."
            id="book-description"
            label="Description"
          >
            <Textarea
              aria-describedby="book-description-hint"
              className="min-h-24"
              id="book-description"
              maxLength={MAX_DESCRIPTION}
              onChange={(event) => set("description")(event.target.value)}
              value={draft.description}
            />
          </Field>
          <div className="grid gap-2">
            <span
              aria-hidden="true"
              className="font-medium text-sm leading-none"
            >
              Owner
            </span>
            <AdminSegmented
              className="w-full"
              label="Owner"
              onChange={(value) => set("owned")(value as Draft["owned"])}
              options={ownerOptions}
              value={draft.owned}
            />
            {draft.owned === "member" ? (
              <>
                <p className="type-caption text-muted-foreground">
                  {owner
                    ? `Lent by ${owner.name ?? "this member"}. It stays theirs.`
                    : "Who lends it to the library? It stays theirs."}
                </p>
                <MemberPicker
                  accounts={accounts.data}
                  onChange={set("ownerId")}
                  pending={accounts.isPending}
                  value={draft.ownerId}
                />
              </>
            ) : (
              <p className="type-caption text-muted-foreground">
                PERKI's own book.
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={pending || needsOwner || language === false}
            form="book-form"
            type="submit"
          >
            {book ? "Save" : "Add book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
