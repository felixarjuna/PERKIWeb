"use client";

import { MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import {
  beginReviewDraft,
  emptyReviewDrafts,
  hasReviewDraft,
  type ReviewKind,
} from "~/lib/review-drafts";
import { type ReviewTarget, reviewTargetLabel } from "~/lib/review-target";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { PassageCommentForm } from "./passage-comment-form";
import { PassageSuggestionForm } from "./passage-suggestion-form";
import { QuoteablePassage } from "./quoteable-passage";
import { TakeawayComments } from "./takeaway-comments";
import { TakeawaySuggestions } from "./takeaway-suggestions";

const TARGETS: ReviewTarget[] = ["tldr", "notes"];
const KINDS: ReviewKind[] = ["comment", "suggest"];

/** Drafts outlive the responsive surface and its active target. */
export function TakeawayReview({
  notes,
  tldr,
  hasTldr,
  takeawayId,
}: {
  notes: ReactNode;
  tldr: ReactNode;
  hasTldr: boolean;
  takeawayId: number;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const thread = api.takeawayComments.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  const suggestions = api.takeawaySuggestions.list.useQuery(
    { takeawayId },
    { retry: false }
  );
  const add = api.takeawayComments.add.useMutation();
  const suggest = api.takeawaySuggestions.add.useMutation();
  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(false);
  const [target, setTarget] = useState<ReviewTarget>("notes");
  const [kind, setKind] = useState<ReviewKind | null>(null);
  const [drafts, setDrafts] = useState(emptyReviewDrafts);
  const [pending, setPending] = useState(false);
  const [requestTargets, setRequestTargets] = useState<
    Partial<Record<ReviewKind, ReviewTarget>>
  >({});
  const origin = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const feedbackButtons = useRef<
    Partial<Record<ReviewTarget, HTMLButtonElement | null>>
  >({});

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const restoreFocus = () => {
    const button = origin.current;
    if (
      button instanceof HTMLButtonElement &&
      button.isConnected &&
      button.getClientRects().length
    ) {
      button.focus({ preventScroll: true });
    } else {
      feedbackButtons.current[target]?.focus({ preventScroll: true });
    }
  };
  const close = () => {
    if (pending) {
      return;
    }
    setOpen(false);
    restoreFocus();
  };
  const escapePanel = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.stopPropagation();
      close();
    }
  });
  useEffect(() => {
    if (!(wide && open)) {
      return;
    }
    document.addEventListener("keydown", escapePanel);
    return () => document.removeEventListener("keydown", escapePanel);
  }, [wide, open]);
  useEffect(() => {
    if (open && wide) {
      const control =
        panel.current?.querySelector<HTMLElement>("textarea") ??
        panel.current?.querySelector<HTMLElement>("button");
      control?.focus({ preventScroll: true });
    }
  }, [open, wide]);

  const show = (
    nextTarget: ReviewTarget,
    nextKind: ReviewKind | null,
    quote = ""
  ) => {
    if (pending) {
      return;
    }
    origin.current = feedbackButtons.current[nextTarget] ?? null;
    setTarget(nextTarget);
    setKind(nextKind);
    if (nextKind) {
      setDrafts((all) => beginReviewDraft(all, nextTarget, nextKind, quote));
    }
    setOpen(true);
  };
  const draft = kind ? drafts[target][kind] : null;
  const updateText = (text: string) => {
    if (!kind) {
      return;
    }
    setDrafts((all) => {
      const current = all[target][kind];
      return current
        ? { ...all, [target]: { ...all[target], [kind]: { ...current, text } } }
        : all;
    });
  };
  const sent = () => {
    if (kind) {
      setDrafts((all) => ({
        ...all,
        [target]: { ...all[target], [kind]: null },
      }));
    }
    setKind(null);
  };
  const content = (
    <div className="flex min-w-0 flex-col gap-4 p-4" ref={panel}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset aria-label="Feedback target" className="flex flex-wrap gap-1">
          {TARGETS.map((each) => (
            <Button
              aria-pressed={target === each}
              disabled={pending}
              key={each}
              onClick={() => {
                setTarget(each);
                setKind(null);
              }}
              size="sm"
              type="button"
              variant={target === each ? "secondary" : "ghost"}
            >
              {reviewTargetLabel(each)}
            </Button>
          ))}
        </fieldset>
        <Button
          aria-label="Close feedback"
          disabled={pending}
          onClick={close}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true">
            <title>Close feedback</title>
          </X>
        </Button>
      </div>
      <h3 className="type-subheading">{reviewTargetLabel(target)} feedback</h3>
      <p className="type-caption text-muted-foreground">
        Only writers and staff can see this feedback.
      </p>
      <div className="flex flex-wrap gap-2">
        {KINDS.filter((each) => hasReviewDraft(each, drafts[target][each])).map(
          (each) => (
            <Button
              aria-pressed={kind === each}
              disabled={pending}
              key={each}
              onClick={() => setKind(each)}
              size="sm"
              type="button"
              variant="secondary"
            >
              {each === "comment" ? "Unsent comment" : "Unsent suggestion"}
            </Button>
          )
        )}
      </div>
      {draft && kind === "comment" && thread.data?.canComment ? (
        <PassageCommentForm
          body={draft.text}
          busy={pending}
          errorMessage={
            requestTargets.comment === target && add.error
              ? `${add.error.message} Your draft is still here. Try again.`
              : undefined
          }
          key={`${target}-comment`}
          onBodyChange={updateText}
          onClose={close}
          onPendingChange={setPending}
          onSubmit={async (input) => {
            setRequestTargets((all) => ({ ...all, comment: target }));
            await add.mutateAsync({ ...input, takeawayId, target });
            await utils.takeawayComments.list.invalidate({ takeawayId });
            sent();
            toast.success("Comment added.");
          }}
          quote={draft.quote}
        />
      ) : null}
      {draft && kind === "suggest" && suggestions.data?.canSuggest ? (
        <PassageSuggestionForm
          busy={pending}
          errorMessage={
            requestTargets.suggest === target && suggest.error
              ? `${suggest.error.message} Your draft is still here. Try again.`
              : undefined
          }
          key={`${target}-suggest`}
          onClose={close}
          onPendingChange={setPending}
          onReplacementChange={updateText}
          onSubmit={async (input) => {
            setRequestTargets((all) => ({ ...all, suggest: target }));
            await suggest.mutateAsync({ ...input, takeawayId, target });
            await utils.takeawaySuggestions.list.invalidate({ takeawayId });
            sent();
            toast.success("Suggestion sent to the writer.");
          }}
          original={draft.quote}
          replacement={draft.text}
        />
      ) : null}
      {!kind && thread.data?.canComment ? (
        <Button
          onClick={() => show(target, "comment")}
          type="button"
          variant="secondary"
        >
          Add comment
        </Button>
      ) : null}
      <TakeawaySuggestions
        onAccepted={() => router.refresh()}
        takeawayId={takeawayId}
        target={target}
      />
      <TakeawayComments hideComposer takeawayId={takeawayId} target={target} />
    </div>
  );
  const canRead = thread.error?.data?.code !== "NOT_FOUND";
  return (
    <div
      className={cn(
        "grid min-w-0 items-start gap-6",
        open && wide && "grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]"
      )}
    >
      <div className="flex min-w-0 flex-col gap-6">
        {TARGETS.map((each) => {
          const label = reviewTargetLabel(each);
          const count =
            (thread.data?.comments.filter(
              (item) => item.target === each && !item.resolvedAt
            ).length ?? 0) +
            (suggestions.data?.suggestions.filter(
              (item) => item.target === each && item.status === "open"
            ).length ?? 0);
          const unsent = KINDS.some((entry) =>
            hasReviewDraft(entry, drafts[each][entry])
          );
          const text = each === "notes" ? notes : tldr;
          return (
            <section
              aria-labelledby={`review-${each}`}
              className="flex min-w-0 flex-col gap-3"
              data-review-target={each}
              key={each}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="type-subheading" id={`review-${each}`}>
                  {label}
                </h3>
                {canRead ? (
                  <Button
                    aria-expanded={open && target === each}
                    aria-label={`${label} feedback${unsent ? ", unsent draft" : ""}`}
                    onClick={() => show(each, null)}
                    ref={(element) => {
                      feedbackButtons.current[each] = element;
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <MessageSquare aria-hidden="true" data-icon="inline-start">
                      <title>Feedback</title>
                    </MessageSquare>
                    Feedback <Badge variant="secondary">{count} open</Badge>
                    {unsent ? (
                      <span className="type-caption">Draft</span>
                    ) : null}
                  </Button>
                ) : null}
              </div>
              {thread.data?.canComment && (each === "notes" || hasTldr) ? (
                <QuoteablePassage
                  label={`${label} text`}
                  onCompose={(nextKind, quote) => show(each, nextKind, quote)}
                  onSubmit={async (input) => {
                    await add.mutateAsync({
                      ...input,
                      takeawayId,
                      target: each,
                    });
                  }}
                  onSuggest={
                    suggestions.data?.canSuggest
                      ? async (input) => {
                          await suggest.mutateAsync({
                            ...input,
                            takeawayId,
                            target: each,
                          });
                        }
                      : undefined
                  }
                >
                  {text}
                </QuoteablePassage>
              ) : (
                text
              )}
            </section>
          );
        })}
      </div>
      {wide && open ? (
        <aside
          aria-label="Review feedback"
          className="sticky top-4 max-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto overscroll-contain rounded-xl bg-card"
        >
          {content}
        </aside>
      ) : null}
      {wide ? null : (
        <Drawer
          onOpenChange={(next) => {
            if (!next) {
              close();
            }
          }}
          open={open}
          shouldScaleBackground={false}
        >
          <DrawerContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreFocus();
            }}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              const control =
                panel.current?.querySelector<HTMLElement>("textarea") ??
                panel.current?.querySelector<HTMLElement>("button");
              control?.focus();
            }}
          >
            <DrawerHeader className="sr-only">
              <DrawerTitle>Review feedback</DrawerTitle>
              <DrawerDescription>
                Comments and suggested edits for the selected text.
              </DrawerDescription>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
