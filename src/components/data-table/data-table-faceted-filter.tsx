"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { Check, CirclePlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import type { DataTableFeatures } from "./data-table-features";

export interface FilterOption {
  label: string;
  value: string;
}

const MAX_BADGES = 2;

/** Multi-select facet filter with per-option counts (tablecn). */
export function DataTableFacetedFilter<TData extends RowData, TValue>({
  column,
  title,
  options,
}: {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  options: readonly FilterOption[];
}) {
  const counts = column.getFacetedUniqueValues();
  const filterValue = column.getFilterValue();
  const selected = new Set(Array.isArray(filterValue) ? filterValue : []);
  const update = (values: Set<unknown>) =>
    column.setFilterValue(values.size ? [...values] : undefined);
  const chosen = options.filter((option) => selected.has(option.value));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-10 gap-2 px-3"
          size="sm"
          type="button"
          variant="secondary"
        >
          <CirclePlus aria-hidden="true" className="text-muted-foreground" />
          {title}
          {chosen.length ? (
            <>
              <Separator className="mx-0.5 h-4" orientation="vertical" />
              <span className="flex gap-1">
                {chosen.length > MAX_BADGES ? (
                  <span className="type-caption rounded-full bg-paper px-2 py-0.5 text-paper-foreground">
                    {chosen.length} selected
                  </span>
                ) : (
                  chosen.map((option) => (
                    <span
                      className="type-caption max-w-24 truncate rounded-full bg-paper px-2 py-0.5 text-paper-foreground"
                      key={option.value}
                    >
                      {option.label}
                    </span>
                  ))
                )}
              </span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 border-0 p-0">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const next = new Set(selected);
                      if (isSelected) {
                        next.delete(option.value);
                      } else {
                        next.add(option.value);
                      }
                      update(next);
                    }}
                    value={option.label}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-sm border border-input",
                        isSelected &&
                          "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {isSelected ? (
                        <Check aria-hidden="true" className="size-3" />
                      ) : null}
                    </span>
                    <span className="flex-1 truncate">{option.label}</span>
                    <span className="type-caption ml-auto text-muted-foreground tabular-nums">
                      {counts.get(option.value) ?? 0}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center"
                    onSelect={() => update(new Set())}
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
