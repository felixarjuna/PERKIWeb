"use client";

import type { LucideIcon } from "lucide-react";
import { Check, CircleCheck, CircleDot, CircleX, Undo2, X } from "lucide-react";
import { PersonAvatar } from "~/components/person-avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { SuggestionStatus } from "~/lib/db/schema/schema";
import type { RouterOutputs } from "~/trpc/react";

type Suggestion =
  RouterOutputs["takeawaySuggestions"]["list"]["suggestions"][number];

const statusBadges: Record<
  SuggestionStatus,
  { icon: LucideIcon; label: string; variant: "draft" | "review" | "published" }
> = {
  accepted: { icon: CircleCheck, label: "Accepted", variant: "published" },
  open: { icon: CircleDot, label: "Open", variant: "review" },
  rejected: { icon: CircleX, label: "Rejected", variant: "draft" },
};

export function SuggestionItem({
  suggestion,
  canDecide,
  acceptBlocked,
  pending,
  onAccept,
  onReject,
  onWithdraw,
}: {
  suggestion: Suggestion;
  canDecide: boolean;
  /** Why accepting has to wait, e.g. unsaved edits in the editor. */
  acceptBlocked?: string;
  pending: boolean;
  onAccept: (id: number, byHand: boolean) => void;
  onReject: (id: number) => void;
  onWithdraw: (id: number) => void;
}) {
  const name = suggestion.author?.name ?? "Deleted account";
  const open = suggestion.status === "open";
  const badge = statusBadges[suggestion.status];
  const StatusIcon = badge.icon;
  return (
    <li className="flex items-start gap-3">
      <PersonAvatar
        person={{ image: suggestion.author?.image ?? null, name }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
          <p className="font-medium text-sm">
            {name}
            {suggestion.mine ? " (you)" : ""}
          </p>
          <time
            className="text-muted-foreground text-xs"
            dateTime={suggestion.createdAt.toISOString()}
          >
            {suggestion.createdAt.toLocaleString("en-GB", {
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
              timeZone: "Europe/Berlin",
            })}
          </time>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl rounded-tl-sm bg-secondary p-4 text-secondary-foreground">
          <div className="flex flex-col gap-1">
            <p className="type-caption text-muted-foreground">Replace</p>
            <del className="whitespace-pre-wrap break-words text-muted-foreground text-sm">
              {suggestion.original}
            </del>
          </div>
          <div className="flex flex-col gap-1">
            <p className="type-caption text-muted-foreground">With</p>
            <ins className="whitespace-pre-wrap break-words text-sm no-underline">
              {suggestion.replacement}
            </ins>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1">
          <Badge size="status" variant={badge.variant}>
            <StatusIcon aria-hidden="true">
              <title>Suggestion status</title>
            </StatusIcon>
            <span>{badge.label}</span>
          </Badge>
          {open ? (
            <SuggestionActions
              acceptBlocked={acceptBlocked}
              canDecide={canDecide}
              onAccept={onAccept}
              onReject={onReject}
              onWithdraw={onWithdraw}
              pending={pending}
              suggestion={suggestion}
            />
          ) : (
            <span className="text-muted-foreground text-xs">
              by {suggestion.decidedBy?.name ?? "Deleted account"}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

/** What the writer and the reviewer can still do with an open suggestion. */
function SuggestionActions({
  suggestion,
  canDecide,
  acceptBlocked,
  pending,
  onAccept,
  onReject,
  onWithdraw,
}: Omit<Parameters<typeof SuggestionItem>[0], "suggestion"> & {
  suggestion: Suggestion;
}) {
  const note = suggestion.applies
    ? acceptBlocked
    : "This passage changed since it was suggested. Apply it by hand in the editor, then mark it as applied.";
  return (
    <>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {canDecide ? (
          <>
            <Button
              disabled={pending}
              onClick={() => onReject(suggestion.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" data-icon="inline-start">
                <title>Reject</title>
              </X>
              Reject
            </Button>
            <Button
              disabled={pending || Boolean(suggestion.applies && acceptBlocked)}
              onClick={() => onAccept(suggestion.id, !suggestion.applies)}
              size="sm"
              type="button"
              variant={suggestion.applies ? "default" : "secondary"}
            >
              <Check aria-hidden="true" data-icon="inline-start">
                <title>Accept</title>
              </Check>
              {suggestion.applies ? "Accept" : "Mark as applied"}
            </Button>
          </>
        ) : null}
        {suggestion.mine ? (
          <Button
            disabled={pending}
            onClick={() => onWithdraw(suggestion.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Undo2 aria-hidden="true" data-icon="inline-start">
              <title>Withdraw</title>
            </Undo2>
            Withdraw
          </Button>
        ) : null}
      </div>
      {canDecide && note ? (
        <p className="basis-full text-muted-foreground text-sm">{note}</p>
      ) : null}
    </>
  );
}
