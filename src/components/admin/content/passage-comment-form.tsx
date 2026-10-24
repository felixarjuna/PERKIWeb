"use client";

import { MessageSquarePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { COMMENT_MAX_LENGTH } from "~/lib/takeaway-comments";

export function PassageCommentForm({
  body,
  quote,
  onBodyChange,
  onClose,
  onPendingChange,
  onSubmit,
  busy = false,
  errorMessage,
}: {
  body: string;
  busy?: boolean;
  errorMessage?: string;
  quote: string;
  onBodyChange: (body: string) => void;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  onSubmit: (input: { body: string; quote: string }) => Promise<void>;
}) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    field.current?.focus({ preventScroll: true });
  }, []);
  const [submitting, setPending] = useState(false);
  const pending = submitting || busy;
  const [error, setError] = useState("");
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || !body.trim()) {
          return;
        }
        setPending(true);
        onPendingChange(true);
        setError("");
        try {
          await onSubmit({ body: body.trim(), quote });
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Couldn’t add the comment. Try again."
          );
        } finally {
          setPending(false);
          onPendingChange(false);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <p className="type-body-sm">
          {quote ? "Comment on passage" : "General feedback"}
        </p>
        {quote ? (
          <blockquote className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words border-primary border-l-2 pl-3 text-muted-foreground text-sm">
            {quote}
          </blockquote>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Comment</Label>
        <Textarea
          disabled={pending}
          id={id}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder="Share your feedback…"
          ref={field}
          required
          rows={4}
          value={body}
        />
      </div>
      {errorMessage || error ? (
        <p className="text-destructive-text text-sm" role="alert">
          {errorMessage || error}
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
        <Button disabled={pending || !body.trim()} size="sm" type="submit">
          <MessageSquarePlus aria-hidden="true" data-icon="inline-start">
            <title>Add comment</title>
          </MessageSquarePlus>
          {pending ? "Adding…" : "Add comment"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Only writers and staff can see this feedback.
      </p>
    </form>
  );
}
