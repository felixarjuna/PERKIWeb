"use client";

import { type LucideIcon, Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";

export interface AdminOption {
  /** Shown before the label in a segmented control. */
  icon?: LucideIcon;
  label: string;
  value: string;
}

/** Radix items cannot hold "", so an empty value ("everything") maps here. */
const EMPTY_VALUE = "__all";

/** Filled, borderless select used by every admin toolbar. */
export function AdminSelect({
  id,
  label,
  value,
  onChange,
  options,
  hideLabel = false,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly AdminOption[];
  hideLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label
        className={cn(
          "type-caption text-muted-foreground",
          hideLabel && "sr-only"
        )}
        htmlFor={id}
      >
        {label}
      </Label>
      <Select
        onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
        value={value || EMPTY_VALUE}
      >
        <SelectTrigger id={id} variant="filter">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value || EMPTY_VALUE}
              value={option.value || EMPTY_VALUE}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Filled search field with a leading icon; the label stays for screen readers. */
export function AdminSearch({
  id,
  label,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "id" | "type"> & {
  id: string;
  label: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Label className="sr-only" htmlFor={id}>
        {label}
      </Label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        className="border-transparent bg-secondary pl-9 placeholder:text-muted-foreground"
        id={id}
        type="search"
        {...props}
      />
    </div>
  );
}

/** Single-choice segmented control for small, always-visible option sets. */
export function AdminSegmented({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly AdminOption[];
  className?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      className={className}
      onValueChange={(next) => {
        if (next) {
          onChange(next);
        }
      }}
      type="single"
      value={value}
    >
      {options.map((option) => (
        <ToggleGroupItem
          className={
            option.icon ? "flex-auto gap-1.5 [&_svg]:shrink-0" : undefined
          }
          key={option.value}
          value={option.value}
        >
          {option.icon ? (
            <option.icon aria-hidden="true" className="size-4" />
          ) : null}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function QueryMessage({
  error,
  onRetry,
  children,
}: {
  error?: boolean;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-xl bg-card p-6"
      role={error ? "alert" : "status"}
    >
      <p className="type-body-sm">
        {error ? (
          "We couldn't load this information. Please try again."
        ) : (
          <span>{children}</span>
        )}
      </p>
      {error && onRetry ? (
        <Button onClick={onRetry} type="button" variant="secondary">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
