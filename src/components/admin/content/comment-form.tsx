"use client";

import { Send } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { COMMENT_MAX_LENGTH } from "~/lib/takeaway-comments";

export function CommentForm({
  onSubmit,
}: {
  onSubmit: (input: { body: string }) => Promise<void>;
}) {
  const id = useId();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || !body.trim()) {
          return;
        }
        setPending(true);
        setError("");
        try {
          await onSubmit({ body: body.trim() });
          setBody("");
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Couldn't add the comment. Try again."
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <Label className="sr-only" htmlFor={`${id}-body`}>
          Comment
        </Label>
        <Textarea
          disabled={pending}
          id={`${id}-body`}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share your feedback…"
          required
          rows={3}
          value={body}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          General feedback on this takeaway
        </p>
        <Button disabled={pending || !body.trim()} size="sm" type="submit">
          <Send aria-hidden="true" data-icon="inline-start">
            <title>Add comment</title>
          </Send>
          {pending ? "Adding comment…" : "Add comment"}
        </Button>
      </div>
    </form>
  );
}
