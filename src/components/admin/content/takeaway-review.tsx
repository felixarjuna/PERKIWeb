"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { QuoteablePassage } from "./quoteable-passage";
import { TakeawayComments } from "./takeaway-comments";
import { TakeawaySuggestions } from "./takeaway-suggestions";

/**
 * Connects passage selection to the comment and suggestion composers without
 * changing the editor.
 */
export function TakeawayReview({
  children,
  takeawayId,
}: {
  children: ReactNode;
  takeawayId: number;
}) {
  const utils = api.useUtils();
  const add = api.takeawayComments.add.useMutation();
  const suggest = api.takeawaySuggestions.add.useMutation();
  const suggestions = api.takeawaySuggestions.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  // Shares the thread's query cache; quoting is offered only to current commenters.
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  return (
    <div className="min-w-0">
      {thread.data?.canComment ? (
        <QuoteablePassage
          onSubmit={async (input) => {
            if (thread.error) {
              const access = await thread.refetch();
              if (access.error || !access.data?.canComment) {
                throw new Error(
                  "Couldn’t verify access. Your draft is still here. Try again."
                );
              }
            }
            await add.mutateAsync({ ...input, takeawayId });
            await utils.takeawayComments.list.invalidate({ takeawayId });
            toast.success("Comment added.");
          }}
          onSuggest={
            suggestions.data?.canSuggest
              ? async (input) => {
                  await suggest.mutateAsync({ ...input, takeawayId });
                  await utils.takeawaySuggestions.list.invalidate({
                    takeawayId,
                  });
                  toast.success("Suggestion sent to the writer.");
                }
              : undefined
          }
        >
          {children}
        </QuoteablePassage>
      ) : (
        children
      )}
      <TakeawaySuggestions takeawayId={takeawayId} />
      <TakeawayComments takeawayId={takeawayId} />
    </div>
  );
}
