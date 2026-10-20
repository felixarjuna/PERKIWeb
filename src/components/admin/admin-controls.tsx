"use client";

import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export function AdminSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label className="type-caption text-muted-foreground" htmlFor={id}>
        {label}
      </Label>
      <select
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </div>
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
