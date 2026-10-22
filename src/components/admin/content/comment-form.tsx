"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { COMMENT_MAX_LENGTH, QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";

export function CommentForm({
  onSubmit,
  quoteRequest,
}: {
  onSubmit: (input: { body: string; quote: string }) => Promise<void>;
  quoteRequest?: { text: string } | null;
}) {
  const id = useId();
  const [body, setBody] = useState("");
  const [quote, setQuote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const commentField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (quoteRequest) {
      setQuote(quoteRequest.text);
      commentField.current?.focus();
      commentField.current?.scrollIntoView({ block: "center" });
    }
  }, [quoteRequest]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || !body.trim()) {
          return;
        }
        setPending(true);
        setError("");
        try {
          await onSubmit({ body: body.trim(), quote: quote.trim() });
          setBody("");
          setQuote("");
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
      <div className="space-y-2">
        <Label htmlFor={`${id}-quote`}>Quoted passage (optional)</Label>
        <Textarea
          disabled={pending}
          id={`${id}-quote`}
          maxLength={QUOTE_MAX_LENGTH}
          onChange={(event) => setQuote(event.target.value)}
          placeholder="Paste the passage you’re commenting on."
          rows={2}
          value={quote}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-body`}>Comment</Label>
        <Textarea
          disabled={pending}
          id={`${id}-body`}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          ref={commentField}
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
      <Button disabled={pending || !body.trim()} type="submit">
        {pending ? "Adding comment…" : "Add comment"}
      </Button>
    </form>
  );
}
