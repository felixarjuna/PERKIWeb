"use client";

import { PencilLine } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { REPLACEMENT_MAX_LENGTH } from "~/lib/takeaway-suggestions";

/** Proposes replacement text for a selected passage; the writer decides. */
export function PassageSuggestionForm({
  original,
  replacement,
  onReplacementChange,
  onClose,
  onPendingChange,
  onSubmit,
}: {
  original: string;
  replacement: string;
  onReplacementChange: (replacement: string) => void;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  onSubmit: (input: { original: string; replacement: string }) => Promise<void>;
}) {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const changed =
    replacement.trim() !== "" && replacement.trim() !== original.trim();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || !changed) {
          return;
        }
        setPending(true);
        onPendingChange(true);
        setError("");
        try {
          await onSubmit({ original, replacement: replacement.trim() });
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Couldn’t send the suggestion. Try again."
          );
        } finally {
          setPending(false);
          onPendingChange(false);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Suggested text</Label>
        <Textarea
          disabled={pending}
          id={id}
          maxLength={REPLACEMENT_MAX_LENGTH}
          onChange={(event) => onReplacementChange(event.target.value)}
          required
          rows={4}
          value={replacement}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-medium text-sm">Replaces</p>
        <blockquote className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words border-primary border-l-2 pl-3 text-muted-foreground text-sm">
          {original}
        </blockquote>
      </div>
      {error ? (
        <p className="text-destructive-text text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button
          disabled={pending}
          onClick={onClose}
          size="sm"
          type="button"
          variant="ghost"
        >
          Close
        </Button>
        <Button disabled={pending || !changed} size="sm" type="submit">
          <PencilLine aria-hidden="true" data-icon="inline-start">
            <title>Suggest edit</title>
          </PencilLine>
          {pending ? "Sending…" : "Suggest edit"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        The writer decides whether to use it. Your suggestion never changes the
        text on its own.
      </p>
    </form>
  );
}
