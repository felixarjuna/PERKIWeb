"use client";

import { type ReactNode, useState } from "react";
import { api } from "~/trpc/react";
import { QuoteablePassage } from "./quoteable-passage";
import { TakeawayComments } from "./takeaway-comments";

/** Connects passage selection to the comment composer without changing the editor. */
export function TakeawayReview({
  children,
  takeawayId,
}: {
  children: ReactNode;
  takeawayId: number;
}) {
  const [quoteRequest, setQuoteRequest] = useState<{ text: string } | null>(
    null
  );
  // Shares the thread's query cache; quoting is offered only to current commenters.
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  return (
    <div className="min-w-0">
      {thread.data?.canComment && !thread.error ? (
        <QuoteablePassage onQuote={(text) => setQuoteRequest({ text })}>
          {children}
        </QuoteablePassage>
      ) : (
        children
      )}
      <TakeawayComments quoteRequest={quoteRequest} takeawayId={takeawayId} />
    </div>
  );
}
