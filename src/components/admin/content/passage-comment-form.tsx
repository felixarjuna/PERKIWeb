"use client";

import { MessageSquarePlus } from "lucide-react";
import { useId, useState } from "react";
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
}: {
  body: string;
  quote: string;
  onBodyChange: (body: string) => void;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
  onSubmit: (input: { body: string; quote: string }) => Promise<void>;
}) {
  const id = useId();
  const [pending, setPending] = useState(false);
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
        <p className="font-medium text-sm">Comment on passage</p>
        <blockquote className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words border-primary border-l-2 pl-3 text-muted-foreground text-sm">
          {quote}
        </blockquote>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Comment</Label>
        <Textarea
          disabled={pending}
          id={id}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder="Share your feedback…"
          required
          rows={4}
          value={body}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
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
