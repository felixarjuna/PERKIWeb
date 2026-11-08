"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React from "react";
import { AdminSegmented } from "~/components/admin/admin-controls";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  BOOK_FORMATS,
  type BookFormat,
  FORMAT_LABELS,
  MAX_CATEGORY,
  MAX_PUBLISHER,
} from "~/lib/library";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

/** The details a book's add, edit and offer forms share (#147). */
export interface BookDetails {
  category: string;
  format: BookFormat;
  publisher: string;
}

export const NO_BOOK_DETAILS: BookDetails = {
  category: "",
  format: "physical",
  publisher: "",
};

const sameText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

/**
 * Picks a category from those books already have, or takes a typed one, so
 * the list doesn't grow "Apologetic" next to "Apologetics".
 */
export function CategoryPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const categories = api.library.categories.useQuery(undefined, {
    enabled: open,
  });
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setTyped("");
  };
  const fresh = typed.trim().slice(0, MAX_CATEGORY);
  const known = categories.data ?? [];
  const isNew = fresh !== "" && !known.some((item) => sameText(item, fresh));
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Category</Label>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-describedby={`${id}-hint`}
            className="w-full justify-between font-normal"
            id={id}
            type="button"
            variant="secondary"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || "No category"}
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
        >
          <Command>
            <CommandInput
              maxLength={MAX_CATEGORY}
              onValueChange={setTyped}
              placeholder="Search or type a category…"
              value={typed}
            />
            <CommandList>
              <CommandEmpty>
                {categories.isPending
                  ? "Loading categories…"
                  : "No category yet."}
              </CommandEmpty>
              <CommandGroup>
                {isNew ? (
                  <CommandItem
                    onSelect={() => choose(fresh)}
                    value={`+${fresh}`}
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Use “{fresh}”
                  </CommandItem>
                ) : null}
                {value ? (
                  <CommandItem onSelect={() => choose("")} value="-none">
                    No category
                  </CommandItem>
                ) : null}
                {known.map((category) => (
                  <CommandItem
                    key={category}
                    onSelect={() => choose(category)}
                    value={category}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "size-4",
                        sameText(category, value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="type-caption text-muted-foreground" id={`${id}-hint`}>
        Optional. Pick one in use, or type a new one.
      </p>
    </div>
  );
}

const FORMAT_OPTIONS = BOOK_FORMATS.map((format) => ({
  label: FORMAT_LABELS[format],
  value: format,
}));

/** Publisher, category and format, in that order. */
export function BookDetailsFields({
  idPrefix,
  value,
  onChange,
  formatHint,
}: {
  idPrefix: string;
  value: BookDetails;
  onChange: (value: BookDetails) => void;
  /** What the chosen format means here. */
  formatHint: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-publisher`}>Publisher</Label>
        <Input
          aria-describedby={`${idPrefix}-publisher-hint`}
          id={`${idPrefix}-publisher`}
          maxLength={MAX_PUBLISHER}
          onChange={(event) =>
            onChange({ ...value, publisher: event.target.value })
          }
          value={value.publisher}
        />
        <p
          className="type-caption text-muted-foreground"
          id={`${idPrefix}-publisher-hint`}
        >
          Optional.
        </p>
      </div>
      <CategoryPicker
        id={`${idPrefix}-category`}
        onChange={(category) => onChange({ ...value, category })}
        value={value.category}
      />
      <div className="grid gap-2">
        <span aria-hidden="true" className="font-medium text-sm leading-none">
          Format
        </span>
        <AdminSegmented
          className="w-full"
          label="Format"
          onChange={(format) =>
            onChange({ ...value, format: format as BookFormat })
          }
          options={FORMAT_OPTIONS}
          value={value.format}
        />
        <p className="type-caption text-muted-foreground">{formatHint}</p>
      </div>
    </>
  );
}
