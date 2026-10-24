"use client";

import {
  Check,
  EyeOff,
  Globe,
  MessageCircle,
  MoreHorizontal,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { TakeawayStatus } from "~/lib/db/schema/schema";
import type {
  OpenRevisionStatus,
  RevisionAction,
} from "~/lib/takeaway-revisions";
import type { StatusAction } from "~/lib/takeaway-status";
import { whatsAppPost } from "~/lib/whatsapp";
import { api } from "~/trpc/react";
import { RequestChangesDialog, SubmitDialog } from "./takeaway-move-dialogs";

/** The Monday broadcast for WhatsApp: title, TL;DR and the page's link. */
async function copyForWhatsApp(id: number, title: string, tldr: string) {
  const url = new URL(`/takeaway/${id}`, window.location.origin).href;
  try {
    await navigator.clipboard.writeText(whatsAppPost({ title, tldr, url }));
    toast.success("Copied for WhatsApp", {
      description: "Paste it into the group chat.",
    });
  } catch {
    toast.error(
      "Your browser blocked copying. Allow clipboard access and try again."
    );
  }
}

/** A move of the takeaway itself or of its open correction (#74). */
type Move = StatusAction | RevisionAction;

/**
 * The icon for a move: unpublishing hides the takeaway, discarding drops its
 * changes, the rest go back a step.
 */
function MoveIcon({
  action,
  inline = false,
}: {
  readonly action: Move;
  readonly inline?: boolean;
}) {
  let Icon = Undo2;
  if (action.to === "discarded") {
    Icon = X;
  } else if (action.confirm) {
    Icon = EyeOff;
  }
  return (
    <Icon aria-hidden="true" data-icon={inline ? "inline-start" : undefined}>
      <title>{action.label}</title>
    </Icon>
  );
}

/**
 * One next step, with less frequent actions in a named menu. `actions`,
 * `revision` and `canManage` come from the server
 * (`takeaways.getManageable`), which allows exactly these moves. While a
 * published takeaway has a correction, its next step comes first.
 */
export function TakeawayActions({
  actions,
  canManage,
  id,
  name,
  revision = null,
  status,
  tldr = null,
}: {
  readonly actions: readonly StatusAction[];
  readonly canManage: boolean;
  readonly id: number;
  readonly name: string;
  /** The open correction of a published takeaway, and its moves. */
  readonly revision?: {
    readonly actions: readonly RevisionAction[];
    readonly status: OpenRevisionStatus;
  } | null;
  readonly status: TakeawayStatus;
  /** Offered as the WhatsApp broadcast once published. */
  readonly tldr?: string | null;
}) {
  const utils = api.useUtils();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmMove, setConfirmMove] = useState<Move | null>(null);
  // Submitting checks open comments; requesting changes asks for a note.
  const [dialog, setDialog] = useState<"note" | "submit" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const onError = (error: { message: string }) => toast.error(error.message);
  const change = api.takeaways.setStatus.useMutation({ onError });
  const changeRevision = api.takeawayRevisions.setStatus.useMutation({
    onError,
  });
  const moved = (action: Move) => async () => {
    setConfirmMove(null);
    setDialog(null);
    await utils.takeaways.getManageable.cancel();
    await Promise.all([
      utils.takeaways.invalidate(),
      utils.takeawayRevisions.invalidate(),
    ]);
    toast.success(action.done);
  };
  const move = (action: Move, note?: string) => {
    if ("revision" in action) {
      changeRevision.mutate(
        { status: action.to, takeawayId: id },
        { onSuccess: moved(action) }
      );
    } else {
      change.mutate(
        { id, note, status: action.to },
        { onSuccess: moved(action) }
      );
    }
  };
  /** Starts a move, through its dialog when it has one. */
  const start = (action: Move) => {
    if (action.confirm) {
      setConfirmMove(action);
    } else if ("requiresNote" in action && action.requiresNote) {
      setDialog("note");
    } else if (
      "requiresResolvedComments" in action &&
      action.requiresResolvedComments
    ) {
      setDialog("submit");
    } else {
      move(action);
    }
  };
  // Back to the menu when it opened the dialog; otherwise Radix's default.
  const restoreFocus = (event: Event) => {
    if (trigger.current) {
      event.preventDefault();
      trigger.current.focus();
    }
  };
  const remove = api.takeaways.deleteTakeaway.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      setConfirmDelete(false);
      await utils.takeaways.getManageable.cancel();
      await utils.takeaways.invalidate();
      toast.success("Takeaway deleted.");
    },
  });
  const moves: Move[] = [...(revision?.actions ?? []), ...actions];
  const primary = moves.find((action) => action.primary);
  const secondary = moves.filter((action) => action !== primary);
  const moving = change.isPending || changeRevision.isPending;
  const pending = moving || remove.isPending;
  const PrimaryIcon = primary?.to === "published" ? Check : Send;
  const showMenu = canManage || secondary.length > 0 || status === "published";
  if (!(primary || showMenu)) {
    return null;
  }
  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 self-start">
      {primary ? (
        <Button
          aria-label={`${primary.label}: ${name}`}
          disabled={pending}
          onClick={() => start(primary)}
          type="button"
        >
          <PrimaryIcon aria-hidden="true" data-icon="inline-start">
            <title>{primary.label}</title>
          </PrimaryIcon>
          {primary.label}
        </Button>
      ) : null}
      {showMenu ? (
        <AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`More actions for ${name}`}
                disabled={pending}
                ref={trigger}
                size="icon"
                type="button"
                variant="secondary"
              >
                <MoreHorizontal aria-hidden="true" data-icon="inline-start">
                  <title>More actions</title>
                </MoreHorizontal>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="overscroll-contain">
              {status === "published" ? (
                <DropdownMenuItem asChild>
                  <Link
                    aria-label={`View public page: ${name}`}
                    href={`/takeaway/${id}`}
                  >
                    <Globe aria-hidden="true">
                      <title>View public page</title>
                    </Globe>
                    View public page
                  </Link>
                </DropdownMenuItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      aria-disabled="true"
                      aria-label={`View public page: ${name}`}
                      className="aria-disabled:opacity-50"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Globe aria-hidden="true">
                        <title>View public page</title>
                      </Globe>
                      View public page
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    This takeaway isn’t published yet.
                  </TooltipContent>
                </Tooltip>
              )}
              {status === "published" && tldr ? (
                <DropdownMenuItem
                  aria-label={`Copy for WhatsApp: ${name}`}
                  onSelect={() => copyForWhatsApp(id, name, tldr)}
                >
                  <MessageCircle aria-hidden="true">
                    <title>Copy for WhatsApp</title>
                  </MessageCircle>
                  Copy for WhatsApp
                </DropdownMenuItem>
              ) : null}
              {secondary.map((action) => (
                <DropdownMenuItem
                  aria-label={`${action.label}: ${name}`}
                  key={action.label}
                  onSelect={() => start(action)}
                >
                  <MoveIcon action={action} />
                  {action.label}
                </DropdownMenuItem>
              ))}
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    aria-label={`Delete ${name}`}
                    className="text-destructive-text focus:text-destructive-text"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 aria-hidden="true">
                      <title>Delete</title>
                    </Trash2>
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes this takeaway. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>
                Keep takeaway
              </AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                disabled={remove.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  remove.mutate({ id });
                }}
              >
                <Trash2 aria-hidden="true" data-icon="inline-start">
                  <title>Delete takeaway</title>
                </Trash2>
                {remove.isPending ? "Deleting…" : "Delete takeaway"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
      <SubmitDialog
        name={name}
        onCancel={() => setDialog(null)}
        onCloseAutoFocus={restoreFocus}
        onSubmit={() => {
          const submit = actions.find((a) => a.requiresResolvedComments);
          if (submit) {
            move(submit);
          }
        }}
        open={dialog === "submit"}
        pending={moving}
        takeawayId={id}
      />
      <RequestChangesDialog
        name={name}
        onCancel={() => setDialog(null)}
        onCloseAutoFocus={restoreFocus}
        onRequest={(note) => {
          const request = actions.find((a) => a.requiresNote);
          if (request) {
            move(request, note);
          }
        }}
        open={dialog === "note"}
        pending={moving}
      />
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmMove(null);
          }
        }}
        open={confirmMove !== null}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmMove?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMove?.confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={moving}>
              {confirmMove?.confirm?.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={moving}
              onClick={(event) => {
                event.preventDefault();
                if (confirmMove) {
                  move(confirmMove);
                }
              }}
            >
              {confirmMove ? <MoveIcon action={confirmMove} inline /> : null}
              {moving
                ? confirmMove?.confirm?.pending
                : confirmMove?.confirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
