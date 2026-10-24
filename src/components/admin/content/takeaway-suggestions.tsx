"use client";

import { useId } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import type { ReviewTarget } from "~/lib/review-target";
import { api } from "~/trpc/react";
import { SuggestionItem } from "./suggestion-item";

/**
 * Suggested edits (#58): reviewers propose replacement text for a passage,
 * the writer or staff accept it (the passage is replaced) or reject it.
 */
export function TakeawaySuggestions({
  takeawayId,
  acceptBlocked,
  onAccepted,
  target,
}: {
  takeawayId: number;
  acceptBlocked?: string;
  target?: ReviewTarget;
  /** Receives the notes after a suggestion replaced a passage. */
  onAccepted?: (text: {
    keypoints: string;
    tldr: string | null;
    target: ReviewTarget;
  }) => void;
}) {
  const headingId = useId();
  const utils = api.useUtils();
  const list = api.takeawaySuggestions.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  const refresh = async () => {
    await utils.takeawaySuggestions.list.invalidate({ takeawayId });
  };
  const onError = async (error: { message: string }) => {
    toast.error(error.message);
    await refresh();
  };
  const accept = api.takeawaySuggestions.accept.useMutation({
    onError,
    onSuccess: async (text, { byHand }) => {
      if (!byHand) {
        onAccepted?.(text);
      }
      await Promise.all([
        refresh(),
        utils.takeaways.getTakeawayById.invalidate({ id: takeawayId }),
        utils.takeawayRevisions.current.invalidate({ takeawayId }),
      ]);
      toast.success(
        byHand ? "Suggestion marked as applied." : "Suggestion accepted."
      );
    },
  });
  const reject = api.takeawaySuggestions.reject.useMutation({
    onError,
    onSuccess: async () => {
      await refresh();
      toast.success("Suggestion rejected.");
    },
  });
  const withdraw = api.takeawaySuggestions.remove.useMutation({
    onError,
    onSuccess: async () => {
      await refresh();
      toast.success("Suggestion withdrawn.");
    },
  });

  // Published notes belonging to another writer have no accessible thread.
  if (list.error?.data?.code === "NOT_FOUND") {
    return null;
  }
  const { data } = list;
  const suggestions =
    data?.suggestions.filter(
      (suggestion) => !target || suggestion.target === target
    ) ?? [];
  if (data && !data.suggestions.length && !data.canSuggest) {
    return null;
  }
  const openCount = suggestions.filter(
    (suggestion) => suggestion.status === "open"
  ).length;
  const pending = accept.isPending || reject.isPending || withdraw.isPending;
  return (
    <section
      aria-labelledby={headingId}
      className="mt-8 min-w-0 space-y-5 border-t pt-6"
    >
      <div className="space-y-1">
        <h2 className="type-subheading" id={headingId}>
          Suggested edits
        </h2>
        <p className="text-muted-foreground text-sm">
          Replacement text from reviewers. The writer decides what to use.
        </p>
      </div>
      {list.isPending ? <p role="status">Loading suggestions…</p> : null}
      {list.error ? (
        <div role="alert">
          <p>Couldn’t load suggestions.</p>
          <Button
            onClick={() => list.refetch()}
            type="button"
            variant="secondary"
          >
            Try again
          </Button>
        </div>
      ) : null}
      {data ? (
        <>
          <p className="font-medium text-sm" role="status">
            {openCount} open · {suggestions.length - openCount} decided
          </p>
          {suggestions.length ? (
            <ol className="space-y-3">
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  acceptBlocked={acceptBlocked}
                  canDecide={data.canDecide}
                  key={suggestion.id}
                  onAccept={(id, byHand) => accept.mutate({ byHand, id })}
                  onReject={(id) => reject.mutate({ id })}
                  onWithdraw={(id) => withdraw.mutate({ id })}
                  pending={pending}
                  suggestion={suggestion}
                />
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">
              No suggestions yet. Select a passage in the text and choose
              Suggest edit.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
